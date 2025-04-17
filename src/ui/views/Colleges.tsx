import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, helpers, useLocalPartial } from "../util/index.ts";
import { CountryFlag, DataTable } from "../components/index.tsx";
import type { View } from "../../common/types.ts";
import { frivolitiesMenu } from "./Frivolities.tsx";
import { wrappedPlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import type { DataTableRow } from "../components/DataTable/index.tsx";

export const genView = (
	type: "college" | "country" | "draftPosition" | "jerseyNumbers",
) => {
	return ({
		challengeNoRatings,
		infos,
		stats,
		userTid,
		displayStat,
	}: View<"colleges">) => {
		useTitleBar({
			title:
				type === "college"
					? "Colleges"
					: type === "country"
						? "Countries"
						: type === "draftPosition"
							? "Best Player at Every Pick"
							: "Jersey Numbers",
			customMenu: frivolitiesMenu,
		});

		const { teamInfoCache } = useLocalPartial(["teamInfoCache"]);

		const superCols = [
			{
				title: "",
				colspan: 8,
			},
			{
				title: "Best Player",
				colspan: 7 + stats.length,
			},
		];

		const cols = getCols(
			[
				type === "college"
					? "College"
					: type === "country"
						? "Country"
						: type === "draftPosition"
							? "Pick"
							: "stat:jerseyNumber",
				"# Players",
				"Active",
				...(type === "jerseyNumbers" ? ["Retired"] : []),
				"HoF",
				"stat:gp",
				"stat:gpPerPlayer",
				`stat:${displayStat}`,
				`stat:${displayStat}PerPlayer`,
				"Name",
				"Pos",
				"Drafted",
				"Retired",
				"Pick",
				"Peak Ovr",
				"Team",
				...stats.map((stat) => `stat:${stat}`),
			],
			{
				Retired: {
					desc: "Number of teams that retired this jersey number",
				},
			},
		);

		const rows: DataTableRow[] = infos.map((c) => {
			const p = c.p;

			const abbrev = teamInfoCache[p.legacyTid]?.abbrev;

			const showRatings = !challengeNoRatings || p.retiredYear !== Infinity;

			return {
				key: c.name,
				metadata: {
					type: "player",
					pid: p.pid,
					season: "career",
					playoffs: "regularSeason",
				},
				data: [
					<a
						href={helpers.leagueUrl([
							"frivolities",
							"most",
							type === "college"
								? "college"
								: type === "country"
									? "country"
									: type === "draftPosition"
										? "at_pick"
										: "jersey_number",
							window.encodeURIComponent(c.name),
						])}
					>
						{type === "country" ? (
							<CountryFlag className="me-1" country={c.name} />
						) : null}
						{type === "draftPosition" && c.name === "undrafted"
							? "none"
							: c.name}
					</a>,
					c.numPlayers,
					c.numActivePlayers,
					...(type === "jerseyNumbers" ? [c.numRetired] : []),
					c.numHof,
					helpers.roundStat(c.gp, "gp"),
					(c.gp / c.numPlayers).toFixed(1),
					helpers.roundStat(c.displayStat, displayStat),
					(c.displayStat / c.numPlayers).toFixed(1),
					{
						...wrappedPlayerNameLabels({
							pid: p.pid,
							jerseyNumber: p.jerseyNumber,
							firstName: p.firstName,
							firstNameShort: p.firstNameShort,
							lastName: p.lastName,
						}),
						classNames: {
							"table-danger": p.hof,
							"table-success": p.retiredYear === Infinity,
							"table-info": p.statsTids.includes(userTid),
						},
					},
					p.bestPos,
					p.draft.year,
					p.retiredYear === Infinity ? null : p.retiredYear,
					p.draft.round > 0 ? `${p.draft.round}-${p.draft.pick}` : "",
					showRatings ? p.peakOvr : null,
					{
						value: (
							<a
								href={helpers.leagueUrl([
									"team_history",
									`${abbrev}_${p.legacyTid}`,
								])}
							>
								{abbrev}
							</a>
						),
						classNames: {
							"table-info": p.legacyTid === userTid,
						},
					},
					...stats.map((stat) => helpers.roundStat(p.careerStats[stat], stat)),
				],
			};
		});

		return (
			<>
				<p>
					Players who have played for your team are{" "}
					<span className="text-info">highlighted in blue</span>. Active players
					are <span className="text-success">highlighted in green</span>. Hall
					of Famers are <span className="text-danger">highlighted in red</span>.
				</p>
				<DataTable
					cols={cols}
					defaultSort={[type === "jerseyNumbers" ? 7 : 6, "desc"]}
					defaultStickyCols={window.mobile ? 0 : 1}
					name={type === "college" ? "Colleges" : "Countries"}
					rows={rows}
					superCols={superCols}
				/>
			</>
		);
	};
};

export default genView("college");
