import getCol from "../../common/getCol.ts";

const getInner = (pOrValue: any, stat: string, raw?: boolean) => {
	const statName = raw ? stat : getCol(`stat:${stat}`).title;
	const value = typeof pOrValue === "number" ? pOrValue : pOrValue[stat];
	return `${value} ${statName}`;
};

// For basketball, pass a player object and a stat key, and derive the value of the stat and the abbrev of the stat from that.
// For other sports, pass the actual number of the stat and a stat key (`raw` false) or whatever custom abbrev you want (`raw` true).
type FormatLiveGameStat = {
	(pOrValue: any[], stat: string[], raw?: boolean): string;
	(pOrValue: any, stat: string, raw?: boolean): string;
};

export const formatLiveGameStat: FormatLiveGameStat = (
	pOrValue: any | any[],
	stat: string | string[],
	raw?: boolean,
) => {
	if (Array.isArray(stat)) {
		return `(${stat
			.map((s, i) => {
				return getInner(pOrValue[i], s, raw);
			})
			.join(", ")})`;
	}

	return `(${getInner(pOrValue, stat, raw)})`;
};
