import limitRating from "./limitRating.ts";
import { random } from "../../util/index.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";

const bonus = (p: PlayerWithoutKey, amount?: number) => {
	const ratings = p.ratings.at(-1);
	const skip = ["fuzz", "injuryIndex", "ovr", "pos", "pot", "season", "skills"];

	for (const key of Object.keys(ratings)) {
		if (skip.includes(key) || typeof ratings[key] !== "number") {
			continue;
		}

		const boost = amount ?? random.randInt(0, 10);
		ratings[key] = limitRating(ratings[key] + boost);
	}
};

export default bonus;
