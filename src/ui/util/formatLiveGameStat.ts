import getCol from "../../common/getCol.ts";

export const formatLiveGameStat = (
	pOrValue: any,
	stat: string,
	valueOverride?: number,
) => {
	const statName = getCol(`stat:${stat}`).title;
	const value = typeof pOrValue === "number" ? pOrValue : pOrValue[stat];
	return `(${value} ${statName})`;
};
