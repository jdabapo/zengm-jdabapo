import type { PlayByPlayEvent as BaseballEvent } from "../GameSim.baseball/PlayByPlayLogger.ts";
import type { PlayByPlayEvent as FootballEvent } from "../GameSim.football/PlayByPlayLogger.ts";
import type { PlayByPlayEvent as BasketballEvent } from "../GameSim.basketball/PlayByPlayLogger.ts";
import type { PlayByPlayEvent as HockeyEvent } from "../GameSim.hockey/PlayByPlayLogger.ts";
import type { TeamNum } from "../../../common/types.ts";

export type PlayByPlayEventStat = {
	type: "stat";
	t: TeamNum;
	pid: number | undefined | null;
	s: string;
	amt: number;
};

export type PlayByPlayEventInit = {
	type: "init";
	boxScore: any;
};

export type PlayByPlayBaseEvent =
	| FootballEvent
	| BaseballEvent
	| BasketballEvent
	| HockeyEvent;

export abstract class PlayByPlayLoggerBase<T extends PlayByPlayBaseEvent> {
	active: boolean = false;
	playByPlay: (T | PlayByPlayEventStat | PlayByPlayEventInit)[] = [];
	constructor(active: boolean) {
		this.active = active;
	}
	abstract logEvent(event: unknown): void;

	logStat(t: TeamNum, pid: number | undefined | null, s: string, amt: number) {
		const statEvent = {
			type: "stat",
			t,
			pid,
			s,
			amt,
		} as const;
		if (!this.active) {
			return;
		}

		this.playByPlay.push(statEvent);
	}

	getPlayByPlay(boxScore: any) {
		if (!this.active) {
			return;
		}

		return [
			{
				type: "init",
				boxScore,
			} as PlayByPlayEventInit,
			...this.playByPlay,
		];
	}
}
