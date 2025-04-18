import { team } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, random, local } from "../../util/index.ts";
import isUntradable from "./isUntradable.ts";
import makeItWork from "./makeItWork.ts";
import processTrade from "./processTrade.ts";
import summary from "./summary.ts";
import type { TradeTeams } from "../../../common/types.ts";
import { isSport } from "../../../common/index.ts";

const getAITids = async () => {
	const teams = await idb.cache.teams.getAll();
	return teams
		.filter((t) => {
			if (t.disabled) {
				return false;
			}

			if (
				(local.autoPlayUntil || g.get("spectator")) &&
				!g.get("challengeNoTrades")
			) {
				return true;
			}
			return !g.get("userTids").includes(t.tid);
		})
		.map((t) => t.tid);
};

const attempt = async (valueChangeKey: number) => {
	const aiTids = await getAITids();

	if (aiTids.length === 0) {
		return false;
	}

	const tid = random.choice(aiTids);
	const otherTids = aiTids.filter((tid2) => tid !== tid2);

	if (otherTids.length === 0) {
		return false;
	}

	const otherTid = random.choice(otherTids);
	const players = (
		await idb.cache.players.indexGetAll("playersByTid", tid)
	).filter((p) => !isUntradable(p).untradable);
	const draftPicks = await idb.cache.draftPicks.indexGetAll(
		"draftPicksByTid",
		tid,
	);

	if (players.length === 0 && draftPicks.length === 0) {
		return false;
	}

	const r = Math.random();
	const pids: number[] = [];
	const dpids: number[] = [];

	if ((r < 0.7 || draftPicks.length === 0) && players.length > 0) {
		// Weight by player value - good player more likely to be in trade
		const p = random.choice(players, (p) => p.value);
		if (!p) {
			return false;
		}
		pids.push(p.pid);
	} else if ((r < 0.85 || players.length === 0) && draftPicks.length > 0) {
		dpids.push(random.choice(draftPicks).dpid);
	} else {
		// Weight by player value - good player more likely to be in trade
		const p = random.choice(players, (p) => p.value);
		const dp = random.choice(draftPicks);
		if (!p || !dp) {
			return false;
		}
		pids.push(p.pid);
		dpids.push(dp.dpid);
	}

	const teams0: TradeTeams = [
		{
			dpids,
			dpidsExcluded: [],
			pids,
			pidsExcluded: [],
			tid,
		},
		{
			dpids: [],
			dpidsExcluded: [],
			pids: [],
			pidsExcluded: [],
			tid: otherTid,
		},
	];

	const teams = await makeItWork(teams0, {
		holdUserConstant: false,
		maxAssetsToAdd: 5,
		valueChangeKey,
	});

	if (!teams) {
		return false;
	}

	// Don't do trades of just picks, it's weird usually
	if (teams[0].pids.length === 0 && teams[1].pids.length === 0) {
		return false;
	}

	// Don't do trades for nothing, it's weird usually
	if (teams[1].pids.length === 0 && teams[1].dpids.length === 0) {
		return false;
	}

	const tradeSummary = await summary(teams);

	if (tradeSummary.warning) {
		return false;
	}

	// Make sure this isn't a really shitty trade
	const dv2 = await team.valueChange(
		teams[0].tid,
		teams[1].pids,
		teams[0].pids,
		teams[1].dpids,
		teams[0].dpids,
		valueChangeKey,
	);
	if (Math.abs(dv2) > 15) {
		return false;
	}

	const finalTids: [number, number] = [teams[0].tid, teams[1].tid];
	const finalPids: [number[], number[]] = [teams[0].pids, teams[1].pids];
	const finalDpids: [number[], number[]] = [teams[0].dpids, teams[1].dpids];
	await processTrade(finalTids, finalPids, finalDpids);

	return true;
};

const DEFAULT_NUM_TEAMS = 30;

const betweenAiTeams = async () => {
	// aiTrades is a legacy option. Only pay attention to it if the new option is at its default value.
	if ((g as any).aiTrades === false && g.get("aiTradesFactor") === 1) {
		return false;
	}

	// If aiTradesFactor is not an integer, use the fractional part as a probability. Like for 3.5, 50% of the times it will be 3, and 50% will be 4.
	// Also scale so there are fewer trade attempts if there are fewer teams.
	let float = g.get("aiTradesFactor");
	if (isSport("baseball")) {
		float *= 0.25;
	}
	if (g.get("numActiveTeams") < DEFAULT_NUM_TEAMS) {
		float *= g.get("numActiveTeams") / DEFAULT_NUM_TEAMS;
	}
	let numAttempts = Math.floor(float);
	const remainder = float % 1;
	if (remainder > 0 && Math.random() < remainder) {
		numAttempts += 1;
	}

	if (numAttempts > 0) {
		let valueChangeKey = Math.random();

		for (let i = 0; i < numAttempts; i++) {
			const tradeHappened = await attempt(valueChangeKey);
			if (tradeHappened) {
				valueChangeKey = Math.random();
			}
		}
	}
};

export default betweenAiTeams;
