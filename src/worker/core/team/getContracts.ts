import { idb } from "../../db/index.ts";
import type { ContractInfo } from "../../../common/types.ts";

/**
 * Gets all the contracts a team owes.
 *
 * This includes contracts for players who have been released but are still owed money.
 *
 * @memberOf core.team
 * @param {number} tid Team ID.
 * @returns {Promise.Array} Array of objects containing contract information.
 */
const getContracts = async (tid: number): Promise<ContractInfo[]> => {
	// First, get players currently on the roster
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	const contracts = players.map((p) => {
		const { pos, skills } = p.ratings.at(-1)!;
		return {
			pid: p.pid,
			firstName: p.firstName,
			lastName: p.lastName,
			skills,
			pos,
			injury: p.injury,
			jerseyNumber:
				p.stats.length > 0 ? p.stats.at(-1).jerseyNumber : undefined,
			watch: p.watch ?? 0,
			amount: p.contract.amount,
			exp: p.contract.exp,
			released: false,
		};
	});

	// Then, get any released players still owed money
	const releasedPlayers = await idb.cache.releasedPlayers.indexGetAll(
		"releasedPlayersByTid",
		tid,
	);

	for (const releasedPlayer of releasedPlayers) {
		const p = await idb.getCopy.players(
			{
				pid: releasedPlayer.pid,
			},
			"noCopyCache",
		);

		if (p) {
			// If a player is deleted, such as if the user deletes retired players, this will be undefined
			contracts.push({
				pid: releasedPlayer.pid,
				firstName: p.firstName,
				lastName: p.lastName,
				skills: p.ratings.at(-1).skills,
				pos: p.ratings.at(-1).pos,
				injury: p.injury,
				jerseyNumber: undefined,
				watch: p.watch ?? 0,
				// undefined check is for old leagues, can delete eventually
				amount: releasedPlayer.contract.amount,
				exp: releasedPlayer.contract.exp,
				released: true,
			});
		} else {
			contracts.push({
				pid: releasedPlayer.pid,
				firstName: "Deleted",
				lastName: "Player",
				skills: [],
				pos: "?",
				injury: {
					type: "Healthy",
					gamesRemaining: 0,
				},
				jerseyNumber: undefined,
				watch: 0,
				amount: releasedPlayer.contract.amount,
				exp: releasedPlayer.contract.exp,
				released: true,
			});
		}
	}

	return contracts;
};

export default getContracts;
