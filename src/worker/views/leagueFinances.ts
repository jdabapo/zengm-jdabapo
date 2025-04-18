import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";

const updateLeagueFinances = async (
	inputs: ViewInput<"leagueFinances">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("newPhase"))) ||
		state.season !== inputs.season
	) {
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			0,
			Infinity,
		]);

		const teams = (
			await idb.getCopies.teamsPlus(
				{
					attrs: ["tid", "budget", "strategy"],
					seasonAttrs: [
						"att",
						"revenue",
						"profit",
						"cash",
						"payrollOrSalaryPaid",
						"pop",
						"abbrev",
						"tid",
						"region",
						"name",
						"imgURL",
						"imgURLSmall",
						"expenseLevels",
					],
					season: inputs.season,
				},
				"noCopyCache",
			)
		).map((t) => {
			const rosterSpots =
				g.get("maxRosterSize") - players.filter((p) => p.tid === t.tid).length;

			return {
				...t,
				rosterSpots,
			};
		});
		return {
			budget: g.get("budget"),
			currentSeason: g.get("season"),
			salaryCapType: g.get("salaryCapType"),
			season: inputs.season,
			salaryCap: g.get("salaryCap") / 1000,
			minPayroll: g.get("minPayroll") / 1000,
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			luxuryTax: g.get("luxuryTax"),
			teams,
			userTid: g.get("userTid"),
		};
	}
};

export default updateLeagueFinances;
