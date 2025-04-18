import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { bySport } from "../../common/index.ts";

const updateTeams = async (
	inputs: ViewInput<"teamStatDists">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		const stats = bySport<any[]>({
			baseball: [
				"pa",
				"ab",
				"pts",
				"h",
				"2b",
				"3b",
				"hr",
				"rbi",
				"sb",
				"cs",
				"bb",
				"so",
				"ba",
				"obp",
				"slg",
				"ops",
				"tb",
				"gdp",
				"hbp",
				"sh",
				"sf",
				"ibb",
				"mov",
				"era",
				"cg",
				"sho",
				"sv",
				"bs",
				"hld",
				"ip",
				"rPit",
				"er",
				"hPit",
				"2bPit",
				"3bPit",
				"hrPit",
				"bbPit",
				"soPit",
				"pc",
				"ibbPit",
				"hbpPit",
				"shPit",
				"sfPit",
				"bk",
				"wp",
				"bf",
				"fip",
				"whip",
				"h9",
				"hr9",
				"bb9",
				"so9",
				"pc9",
				"sow",
			],
			basketball: [
				"fg",
				"fga",
				"fgp",
				"tp",
				"tpa",
				"tpp",
				"ft",
				"fta",
				"ftp",
				"orb",
				"drb",
				"trb",
				"ast",
				"tov",
				"stl",
				"blk",
				"pf",
				"pts",
				"oppPts",
			],
			football: [
				"pts",
				"yds",
				"ply",
				"ydsPerPlay",
				"tov",
				"fmbLost",
				"pssCmp",
				"pss",
				"pssYds",
				"pssTD",
				"pssInt",
				"pssNetYdsPerAtt",
				"rus",
				"rusYds",
				"rusTD",
				"rusYdsPerAtt",
				"pen",
				"penYds",
				"drives",
				"drivesScoringPct",
				"drivesTurnoverPct",
				"avgFieldPosition",
				"timePerDrive",
				"playsPerDrive",
				"ydsPerDrive",
				"ptsPerDrive",
				"oppPts",
				"oppYds",
				"oppPly",
				"oppYdsPerPlay",
				"oppTov",
				"oppFmbLost",
				"oppPssCmp",
				"oppPss",
				"oppPssYds",
				"oppPssTD",
				"oppPssInt",
				"oppPssNetYdsPerAtt",
				"oppRus",
				"oppRusYds",
				"oppRusTD",
				"oppRusYdsPerAtt",
				"oppPen",
				"oppPenYds",
				"oppDrives",
				"oppDrivesScoringPct",
				"oppDrivesTurnoverPct",
				"oppAvgFieldPosition",
				"oppTimePerDrive",
				"oppPlaysPerDrive",
				"oppYdsPerDrive",
				"oppPtsPerDrive",
			],
			hockey: [
				"g",
				"a",
				"pim",
				"evG",
				"ppG",
				"shG",
				"evA",
				"ppA",
				"shA",
				"s",
				"sPct",
				"tsa",
				"ppo",
				"ppPct",
				"fow",
				"fol",
				"foPct",
				"blk",
				"hit",
				"tk",
				"gv",
				"sv",
				"svPct",
				"gaa",
				"so",
				"oppG",
				"oppA",
				"oppPim",
				"oppEvG",
				"oppPpG",
				"oppShG",
				"oppEvA",
				"oppPpA",
				"oppShA",
				"oppS",
				"oppSPct",
				"oppTsa",
				"oppPpo",
				"oppPpPct",
				"oppFow",
				"oppFol",
				"oppFoPct",
				"oppBlk",
				"oppHit",
				"oppTk",
				"oppGv",
				"oppSv",
				"oppSvPct",
				"oppGaa",
				"oppSo",
				"oppRbs",
			],
		});
		const teams = await idb.getCopies.teamsPlus(
			{
				seasonAttrs: ["won", "lost"],
				stats,
				season: inputs.season,
			},
			"noCopyCache",
		);

		type Keys =
			| keyof (typeof teams)[number]["seasonAttrs"]
			| keyof (typeof teams)[number]["stats"];
		type StatsAll = Record<Keys, number[]>;
		const statsAll = teams.reduce((memo: StatsAll, t) => {
			for (const cat of ["seasonAttrs", "stats"] as const) {
				for (const stat of helpers.keys(t[cat])) {
					if (memo[stat]) {
						memo[stat].push((t[cat] as any)[stat]);
					} else {
						memo[stat] = [(t[cat] as any)[stat]];
					}
				}
			}

			return memo;
		}, {}) as never as StatsAll;

		return {
			season: inputs.season,
			statsAll,
		};
	}
};

export default updateTeams;
