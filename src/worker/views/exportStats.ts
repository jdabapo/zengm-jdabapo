import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";

const updateExportStats = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("newPhase")) {
		const options = [
			{
				key: "all",
				val: "All Seasons",
			},
		];

		for (
			let season = g.get("startingSeason");
			season <= g.get("season");
			season++
		) {
			options.push({
				key: String(season),
				val: `${season} season`,
			});
		}

		return {
			seasons: options,
		};
	}
};

export default updateExportStats;
