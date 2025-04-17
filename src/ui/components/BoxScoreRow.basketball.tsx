import clsx from "clsx";
import type { MouseEvent } from "react";
import PlayerNameLabels from "./PlayerNameLabels.tsx";
import { helpers } from "../util/index.ts";

const BoxScoreRow = ({
	className,
	exhibition,
	lastStarter,
	liveGameInProgress,
	onClick,
	p,
	season,
}: {
	className?: string;
	exhibition?: boolean;
	lastStarter?: boolean;
	liveGameInProgress?: boolean;
	onClick?: (event: MouseEvent) => void;
	p: any;
	season: number;
}) => {
	const showDNP =
		p.min === 0 &&
		(!liveGameInProgress ||
			(p.injury.gamesRemaining > 0 && !p.injury.playingThrough));

	const statCols = showDNP ? (
		<td colSpan={15} className="text-center">
			DNP -{" "}
			{p.injury.gamesRemaining === 0 || p.injury.playingThrough
				? "Coach's decision"
				: p.injury.type}
		</td>
	) : (
		<>
			<td>{helpers.formatNumber(p.min, "minutes")}</td>
			<td>
				{p.fg}-{p.fga}
			</td>
			<td>
				{p.tp}-{p.tpa}
			</td>
			<td>
				{p.ft}-{p.fta}
			</td>
			<td>{p.orb}</td>
			<td>{p.drb + p.orb}</td>
			<td>{p.ast}</td>
			<td>{p.tov}</td>
			<td>{p.stl}</td>
			<td>{p.blk}</td>
			<td>{p.ba}</td>
			<td>{p.pf}</td>
			<td>{p.pts}</td>
			<td>{helpers.plusMinus(p.pm, 0)}</td>
			<td>{helpers.gameScore(p).toFixed(1)}</td>
		</>
	);

	return (
		<tr
			className={clsx(className, {
				separator: lastStarter,
			})}
			onClick={onClick}
		>
			<td>
				<PlayerNameLabels
					injury={p.injury}
					jerseyNumber={p.jerseyNumber}
					pid={p.pid}
					skills={p.skills}
					legacyName={p.name}
					disableNameLink={exhibition}
					season={season}
				/>
			</td>
			{typeof p.abbrev === "string" ? (
				<td>
					<a href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`])}>
						{p.abbrev}
					</a>
				</td>
			) : null}
			<td>{p.pos}</td>
			{statCols}
		</tr>
	);
};

export default BoxScoreRow;
