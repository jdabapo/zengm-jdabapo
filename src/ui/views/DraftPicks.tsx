import { DataTable, MoreLinks } from "../components";
import useTitleBar from "../hooks/useTitleBar";
import { getCols, helpers } from "../util";
import type { View } from "../../common/types";
import type { DataTableRow } from "../components/DataTable";
import { orderBy } from "../../common/utils";

const DraftTeamHistory = ({
	abbrev,
	challengeNoRatings,
	draftPicks,
	draftType,
}: View<"draftPicks">) => {
	useTitleBar({
		title: "Draft Picks",
		dropdownView: "draft_picks",
		dropdownFields: { teams: abbrev },
	});

	const cols = getCols(
		[
			"Year",
			"Draft Round",
			"Draft Pick",
			"Team",
			"Power Ranking",
			"Ovr",
			"Record",
			"AvgAge",
			"Strategy",
		],
		{
			"Draft Round": {
				title: "Round",
			},
			"Draft Pick": {
				title: "Pick",
			},
			AvgAge: {
				title: "Avg Age",
			},
			Ovr: {
				title: "Team Ovr",
			},
		},
	);

	const rows: DataTableRow[] = orderBy(
		draftPicks,
		[
			"season",
			"round",
			(dp) => (dp.pick > 0 ? dp.pick : (dp.projectedPick ?? 0)),
			"powerRanking",
		],
		["asc", "asc", "asc", "asc"],
	).map((dp) => {
		return {
			key: dp.dpid,
			data: [
				dp.season === "fantasy"
					? {
							value: "Fantasy",
							sortValue: -Infinity,
						}
					: dp.season === "expansion"
						? {
								value: "Expansion",
								sortValue: -Infinity,
							}
						: dp.season,
				dp.round,
				dp.pick > 0 ? (
					dp.pick
				) : dp.projectedPick !== undefined ? (
					<i className="text-body-secondary">{dp.projectedPick}</i>
				) : null,
				dp.originalTid !== dp.tid ? (
					<a
						href={helpers.leagueUrl([
							"roster",
							`${dp.originalAbbrev}_${dp.originalTid}`,
						])}
					>
						{dp.originalAbbrev}
					</a>
				) : null,
				dp.powerRanking,
				!challengeNoRatings ? dp.ovr : null,
				helpers.formatRecord(dp.record),
				dp.avgAge?.toFixed(1),
				dp.strategy,
			],
		};
	});

	return (
		<>
			<MoreLinks type="draft" page="draft_picks" draftType={draftType} />

			<p>
				Projected draft pick numbers are shown in{" "}
				<i className="text-body-secondary">faded italics</i>.
			</p>

			<DataTable
				style={{
					maxWidth: 570,
				}}
				cols={cols}
				defaultSort={[0, "asc"]}
				name="DraftPicks"
				rows={rows}
			/>
		</>
	);
};

export default DraftTeamHistory;
