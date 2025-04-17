import { PHASE } from "../../../common/index.ts";
import type { PlayerInjury } from "../../../common/types.ts";
import { defaultGameAttributes } from "../../util/index.ts";
import type { Basketball } from "./loadData.basketball.ts";

const getGamesToHeal = ({
	row,
	season,
	phase,
	numGames,
	numGamesPlayoffSeries,
}: {
	row: NonNullable<Basketball["injuries"][string]>[number];
	season: number;
	phase: number;
	numGames: number;
	numGamesPlayoffSeries: number[];
}) => {
	let gamesToHeal = 0;

	let passedRegularSeason;
	let passedPlayoffs;
	let passedAfterPlayoffs;
	let passedFreeAgency;

	if (season === row.season) {
		passedRegularSeason =
			row.phase <= PHASE.REGULAR_SEASON && phase > PHASE.REGULAR_SEASON;
		passedPlayoffs = row.phase <= PHASE.PLAYOFFS && phase > PHASE.PLAYOFFS;
		passedAfterPlayoffs =
			row.phase <= PHASE.DRAFT_LOTTERY && phase > PHASE.DRAFT_LOTTERY;
		passedFreeAgency =
			row.phase <= PHASE.FREE_AGENCY && phase > PHASE.FREE_AGENCY;
	} else if (season === row.season + 1 && phase <= PHASE.PLAYOFFS) {
		passedRegularSeason = row.phase <= PHASE.REGULAR_SEASON;
		passedPlayoffs = row.phase <= PHASE.PLAYOFFS;
		passedAfterPlayoffs = row.phase <= PHASE.DRAFT_LOTTERY;
		passedFreeAgency = row.phase <= PHASE.FREE_AGENCY;
	} else {
		throw new Error("Unexpected season");
	}

	if (passedRegularSeason) {
		gamesToHeal += numGames;
	}

	if (passedPlayoffs) {
		for (const games of numGamesPlayoffSeries) {
			gamesToHeal += games;
		}
	}

	if (passedAfterPlayoffs) {
		gamesToHeal += defaultGameAttributes.numGames[0].value;
	}

	if (passedFreeAgency) {
		gamesToHeal += 30;
	}

	return gamesToHeal;
};

const getInjury = ({
	injuries,
	slug,
	season,
	phase,
	numGames,
	numGamesPlayoffSeries,
	draftProspect,
	draftYear,
}: {
	injuries: Basketball["injuries"];
	slug: string;
	season: number;
	phase: number;
	numGames: number;
	numGamesPlayoffSeries: number[];
	draftProspect: boolean;
	draftYear: number;
}): PlayerInjury | undefined => {
	const playerInjuries = injuries[slug];

	if (!playerInjuries) {
		return;
	}

	let row;
	if (draftProspect) {
		// Currently defined in injuries.csv as starting at the beginning of the rookie season, maybe should change in the future
		row = playerInjuries.find(
			(injury) => injury.season === draftYear + 1 && injury.phase === 0,
		);
	} else {
		// Take most recent injury, up to one season back. injuries is already sorted descending by season/phase
		row = playerInjuries.find(
			(injury) =>
				(injury.season === season && injury.phase <= phase) ||
				(injury.season === season - 1 && injury.phase > phase),
		);
	}

	if (!row) {
		return;
	}

	let gamesRemaining = row.gamesRemaining;

	// Heal injury if it's from an earlier season/phase
	if (!draftProspect) {
		const gamesToHeal = getGamesToHeal({
			row,
			season,
			phase,
			numGames,
			numGamesPlayoffSeries,
		});
		gamesRemaining -= gamesToHeal;
	}

	if (gamesRemaining > 0) {
		return {
			type: row.type,
			gamesRemaining,
		};
	}
};

export default getInjury;
