import { useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import type { View } from "../../common/types.ts";
import { helpers, toWorker } from "../util/index.ts";
import { TeamLogoJerseyInfo } from "../components/TeamLogoJerseyInfo.tsx";
import clsx from "clsx";
import { wait } from "../../common/index.ts";

export const AutoRelocateExpandSubmit = ({
	godMode,
	override,
	setOverride,
	status,
	vote,
	voteTextNo,
	voteTextYes,
	resultTextYes,
	resultTextNo,
}: {
	godMode: boolean;
	override: boolean;
	setOverride: (cb: (checked: boolean) => boolean) => void;
	status:
		| {
				type: "init";
		  }
		| {
				type: "voted";
		  }
		| {
				type: "results";
				for: number;
				against: number;
		  };
	vote: (userVote: boolean) => void;
	voteTextNo: string;
	voteTextYes: string;
	resultTextYes: string;
	resultTextNo: string;
}) => {
	return (
		<>
			{status.type === "init" ? (
				<div>
					<p className="fs-5">
						This must be approved by a majority of teams. How do you vote?
					</p>
					<div className="text-center d-inline-block">
						<div className="d-flex gap-3">
							<button
								className="btn btn-lg btn-success"
								onClick={() => {
									vote(true);
								}}
							>
								{voteTextYes}
							</button>
							<button
								className="btn btn-lg btn-danger"
								onClick={() => {
									vote(false);
								}}
							>
								{voteTextNo}
							</button>
						</div>
						{godMode ? (
							<div className="mt-3">
								<label className="god-mode god-mode-text mb-0">
									<input
										className="form-check-input me-1"
										type="checkbox"
										onChange={() => {
											setOverride((checked) => !checked);
										}}
										checked={override}
									/>
									Force result
								</label>
							</div>
						) : null}
					</div>
				</div>
			) : status.type === "voted" ? (
				<div className="d-flex align-items-center">
					<div className="spinner-border" />
					<div className="ms-2 fs-4">Gathering votes...</div>
				</div>
			) : (
				<div>
					{status.for > status.against ? (
						<h2 className="text-success">{resultTextYes}</h2>
					) : (
						<h2 className="text-danger">{resultTextNo}</h2>
					)}
					<div>
						Final vote: {status.for} for, {status.against} against.
					</div>
				</div>
			)}
		</>
	);
};

const AutoRelocate = ({
	autoRelocateRealign,
	autoRelocateRebrand,
	currentTeam,
	godMode,
	newTeam,
	realignInfo,
}: View<"autoRelocate">) => {
	useTitleBar({ title: "Team Relocation Vote" });

	const [rebrandTeam, setRebrandTeam] = useState(autoRelocateRebrand);
	const brandedTeam = rebrandTeam ? newTeam : currentTeam;

	const [realign, setRealign] = useState(autoRelocateRealign);
	const [override, setOverride] = useState(false);

	const [status, setStatus] = useState<
		| {
				type: "init";
		  }
		| {
				type: "voted";
		  }
		| {
				type: "results";
				for: number;
				against: number;
		  }
	>({ type: "init" });

	const vote = async (userVote: boolean) => {
		if (status.type !== "init") {
			return;
		}
		setStatus({
			type: "voted",
		});

		const results = await toWorker("main", "relocateVote", {
			override,
			realign,
			rebrandTeam,
			userVote,
		});

		await wait(2000);

		setStatus({
			type: "results",
			...results,
		});
	};

	return (
		<>
			<div className="mb-5 fs-5">
				The{" "}
				<a
					href={helpers.leagueUrl([
						"roster",
						`${currentTeam.abbrev}_${currentTeam.tid}`,
					])}
				>
					{currentTeam.region} {currentTeam.name}
				</a>{" "}
				want to move to <b>{newTeam.region}</b>.
			</div>

			<div className="d-flex flex-wrap gap-5 mb-5">
				<div>
					<TeamLogoJerseyInfo
						brandedTeam={brandedTeam}
						selectedTeam={newTeam}
					/>
					<div className="form-check mt-2">
						<input
							type="checkbox"
							className="form-check-input"
							id="relocate-reband"
							checked={rebrandTeam}
							disabled={status.type !== "init"}
							onChange={() => {
								setRebrandTeam((checked) => !checked);
							}}
						/>
						<label className="form-check-label" htmlFor="relocate-reband">
							Rebrand team
						</label>
					</div>
				</div>

				{realignInfo ? (
					<div>
						<h3>Divisions after relocation</h3>

						{(realign ? realignInfo.realigned : realignInfo.current).map(
							(conf, i) => {
								return (
									<div
										key={i}
										className={clsx("d-flex gap-3", {
											"mt-2": i > 0,
										})}
									>
										{conf.map((div, j) => {
											return (
												<ul
													key={j}
													className="list-unstyled mb-0"
													style={{ width: 170 }}
												>
													{div.map((t) => {
														let teamName = `${t.region} ${t.name}`;
														if (t.tid === newTeam.tid) {
															if (!rebrandTeam) {
																teamName = `${t.region} ${currentTeam.name}`;
															}
														}

														return (
															<li
																key={t.tid}
																className={clsx("text-truncate", {
																	"text-success": t.tid === newTeam.tid,
																	"text-info":
																		realign &&
																		t.tid !== newTeam.tid &&
																		!realignInfo.current[i][j].some(
																			(t2) => t2.tid === t.tid,
																		),
																})}
															>
																{teamName}
															</li>
														);
													})}
												</ul>
											);
										})}
									</div>
								);
							},
						)}
						<div className="form-check mt-2">
							<input
								type="checkbox"
								className="form-check-input"
								id="relocate-realign"
								checked={realign}
								disabled={status.type !== "init"}
								onChange={() => {
									setRealign((checked) => !checked);
								}}
							/>
							<label className="form-check-label" htmlFor="relocate-realign">
								Realign divisions
							</label>
						</div>
					</div>
				) : null}
			</div>

			<AutoRelocateExpandSubmit
				godMode={godMode}
				override={override}
				setOverride={setOverride}
				status={status}
				vote={vote}
				voteTextYes={`Move to ${newTeam.region}`}
				voteTextNo={`Stay in ${currentTeam.region}`}
				resultTextYes="Relocation approved!"
				resultTextNo="Relocation denied!"
			/>
		</>
	);
};

export default AutoRelocate;
