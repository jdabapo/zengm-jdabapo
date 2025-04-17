import type { DBSchema, IDBPDatabase } from "@dumbmatter/idb";
import { isSport } from "../../common/index.ts";
import type {
	League,
	Options,
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../common/types.ts";
import type { Settings } from "../views/settings.ts";
import connectIndexedDB from "./connectIndexedDB.ts";

export interface MetaDB extends DBSchema {
	achievements: {
		key: number;
		value: {
			slug: string;
			difficulty?: "normal" | "hard" | "insane";
		};
	};
	attributes: {
		value:
			| number
			| string
			| Options
			| RealPlayerPhotos
			| RealTeamInfo
			| Partial<Settings>;
		key:
			| "lastChangesVersion"
			| "nagged"
			| "naggedMailingList"
			| "options"
			| "realPlayerPhotos"
			| "realTeamInfo"
			| "defaultSettingsOverrides";
	};
	leagues: {
		value: League;
		key: number;
		autoIncrementKeyPath: "lid";
	};
}

const create = (db: IDBPDatabase<MetaDB>) => {
	db.createObjectStore("achievements", {
		keyPath: "aid",
		autoIncrement: true,
	});
	const attributeStore = db.createObjectStore("attributes");
	db.createObjectStore("leagues", {
		keyPath: "lid",
		autoIncrement: true,
	});
	attributeStore.put(0, "nagged");
	attributeStore.put("VERSION_NUMBER", "lastChangesVersion");
};

const migrate = async ({
	db,
	oldVersion,
}: {
	db: IDBPDatabase<MetaDB>;
	oldVersion: number;
}) => {
	console.log(
		`Upgrading meta database from version ${oldVersion} to version ${db.version}`,
	);

	if (isSport("basketball") || isSport("football")) {
		if (oldVersion <= 6) {
			db.createObjectStore("achievements", {
				keyPath: "aid",
				autoIncrement: true,
			});
		}

		if (oldVersion <= 7) {
			const attributeStore = db.createObjectStore("attributes");
			attributeStore.put(0, "nagged");
		}
	}

	// New ones here!

	// In next version, can do:
	// attributeStore.delete("lastSelectedTid");
};

const connectMeta = () =>
	connectIndexedDB<MetaDB>({
		name: "meta",
		version: 8,
		lid: -1,
		create,
		migrate,
	});

export default connectMeta;
