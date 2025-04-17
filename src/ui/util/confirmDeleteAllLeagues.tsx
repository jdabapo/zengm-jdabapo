import { useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "../components/Modal.tsx";

const Confirm = confirmable<unknown, "all" | "unstarred" | null>(
	({ show, proceed }) => {
		const [unstarredOnly, setUnstarredOnly] = useState(true);

		const inputRef = useRef<HTMLInputElement>(null);

		useEffect(() => {
			if (inputRef.current) {
				inputRef.current.select();
			}
		}, []);

		const cancel = () => proceed(null);
		const ok = () => proceed(unstarredOnly ? "unstarred" : "all");

		return (
			<Modal show={show} onHide={cancel}>
				<Modal.Body>
					Are you sure you want to delete ALL data in ALL of your leagues?
					<form
						className="mt-3"
						onSubmit={(event) => {
							event.preventDefault();
							ok();
						}}
					>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								checked={unstarredOnly}
								id="deleteAllLeaguesType"
								onChange={() => {
									setUnstarredOnly((checked) => !checked);
								}}
							/>
							<label
								className="form-check-label"
								htmlFor="deleteAllLeaguesType"
							>
								Unstarred leagues only
							</label>
						</div>
					</form>
				</Modal.Body>

				<Modal.Footer>
					<button className="btn btn-secondary" onClick={cancel}>
						Cancel
					</button>
					<button className="btn btn-danger" onClick={ok}>
						Delete All Leagues
					</button>
				</Modal.Footer>
			</Modal>
		);
	},
);

const confirmFunction = createConfirmation(Confirm);

const confirmDeleteAllLeagues = () => {
	return confirmFunction({});
};

export default confirmDeleteAllLeagues;
