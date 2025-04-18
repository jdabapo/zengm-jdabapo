import { draft, league } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import type { PhaseReturn } from "../../../common/types.ts";

const newPhaseAfterDraft = async (): Promise<PhaseReturn> => {
	// In case some weird situation results in games still in the schedule, clear them
	await idb.cache.schedule.clear();

	await draft.genPicks({
		afterDraft: true,
	});

	// Delete any old draft picks
	const draftPicks = await idb.cache.draftPicks.getAll();
	for (const dp of draftPicks) {
		if (typeof dp.season !== "number" || dp.season <= g.get("season")) {
			await idb.cache.draftPicks.delete(dp.dpid);
		}
	}

	// Already set in afterPicks, but do again just to be sure
	await league.setGameAttributes({
		numDraftPicksCurrent: undefined,
	});

	return {
		updateEvents: ["playerMovement"],
	};
};

export default newPhaseAfterDraft;
