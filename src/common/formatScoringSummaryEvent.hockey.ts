import type {
	PlayByPlayEventOutput,
	PlayByPlayEventScore,
} from "../worker/core/GameSim.hockey/PlayByPlayLogger.ts";
import type { PlayByPlayBaseEvent } from "../worker/core/GameSim/PlayByPlayLoggerBase.ts";

export const formatScoringSummaryEvent = (
	event: PlayByPlayBaseEvent<PlayByPlayEventOutput>,
): PlayByPlayEventScore | undefined => {
	if (event.type === "goal" || event.type === "shootoutShot") {
		return event;
	}
};
