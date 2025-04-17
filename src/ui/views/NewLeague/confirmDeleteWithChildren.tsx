import { useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "../../components/Modal.tsx";

type Args = {
	text: string;
	deleteButtonText: string;
	deleteChildrenText: string;
	siblings: {
		key: number;
		text: string;
	}[];
};

const Confirm = confirmable<
	Args,
	{
		proceed: boolean;
		key?: number;
	}
>(({ show, proceed, deleteButtonText, deleteChildrenText, text, siblings }) => {
	const [controlledValue, setControlledValue] = useState<number | undefined>();
	const ok = () =>
		proceed({
			proceed: true,
			key: controlledValue,
		});
	const cancel = () =>
		proceed({
			proceed: false,
		});
	const selectRef = useRef<HTMLSelectElement>(null);

	useEffect(() => {
		if (selectRef.current) {
			selectRef.current.focus();
		}
	}, []);

	return (
		<Modal show={show} onHide={cancel}>
			<Modal.Body>
				{text}
				<form
					className="mt-3"
					onSubmit={(event) => {
						event.preventDefault();
						ok();
					}}
				>
					<select
						ref={selectRef}
						className="form-select"
						value={controlledValue}
						onChange={(event) => {
							const value = event.target.value;
							setControlledValue(
								value === "delete" ? undefined : Number.parseInt(value),
							);
						}}
					>
						<option value="delete">{deleteChildrenText}</option>
						{siblings.map(({ key, text }) => (
							<option key={key} value={key}>
								{text}
							</option>
						))}
					</select>
				</form>
			</Modal.Body>

			<Modal.Footer>
				<button className="btn btn-secondary" onClick={cancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={ok}>
					{deleteButtonText}
				</button>
			</Modal.Footer>
		</Modal>
	);
});

const confirmFunction = createConfirmation(Confirm);

const confirmDeleteWithChildren = (args: Args) => {
	return confirmFunction(args);
};

export default confirmDeleteWithChildren;
