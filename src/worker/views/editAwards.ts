import { bySport, PHASE } from "../../common/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { orderBy } from "../../common/utils.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";

const updateAwards = async (
	inputs: ViewInput<"editAwards">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (!g.get("godMode")) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			errorMessage: "You can't edit awards unless you enable God Mode.",
		};
		return returnValue;
	}

	let season = inputs.season;
	let awards = await idb.getCopy.awards(
		{
			season,
		},
		"noCopyCache",
	);
	if (!awards) {
		if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
			season -= 1;
			awards = await idb.getCopy.awards(
				{
					season,
				},
				"noCopyCache",
			);
		}
	}
	if (awards && !awards.sfmvp) {
		awards.sfmvp = [];
	}
	if (
		(season === g.get("season") && updateEvents.includes("newPhase")) ||
		season !== state.season
	) {
		// Don't use cache, in case this is the current season and we want to include players who just retired
		let playersAll = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);

		playersAll = orderBy(playersAll, ["lastName", "firstName"]);

		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "name"],
			ratings: ["pos"],
			stats: bySport({
				baseball: ["abbrev", "tid", "keyStats"],
				basketball: ["abbrev", "tid", "pts", "trb", "ast", "blk", "stl"],
				football: ["abbrev", "tid", "keyStats"],
				hockey: [
					"abbrev",
					"tid",
					"keyStatsWithGoalieGP",
					"a",
					"dps",
					"g",
					"gaa",
					"gps",
					"hit",
					"ops",
					"pts",
					"svPct",
					"tk",
				],
			}),
			fuzz: true,
			mergeStats: "totOnly",
			season,
		});

		return {
			godMode: g.get("godMode"),
			players,
			awards,
			season,
		};
	}
};
export default updateAwards;
