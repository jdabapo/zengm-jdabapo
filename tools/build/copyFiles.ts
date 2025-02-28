import fs from "node:fs";
import fsp from "node:fs/promises";
import { bySport } from "../lib/bySport.ts";
import { replace } from "./replace.ts";

const setSport = () => {
	replace({
		paths: ["build/index.html"],
		replaces: [
			{
				searchValue: "GAME_NAME",
				replaceValue: bySport({
					baseball: "ZenGM Baseball",
					basketball: "Basketball GM",
					football: "Football GM",
					hockey: "ZenGM Hockey",
				}),
			},
			{
				searchValue: "SPORT",
				replaceValue: bySport({
					baseball: "baseball",
					basketball: "basketball",
					football: "football",
					hockey: "hockey",
				}),
			},
			{
				searchValue: "GOOGLE_ANALYTICS_COOKIE_DOMAIN",
				replaceValue: bySport({
					basketball: "basketball-gm.com",
					football: "football-gm.com",
					default: "zengm.com",
				}),
			},
			{
				searchValue: "WEBSITE_ROOT",
				replaceValue: bySport({
					baseball: "zengm.com/baseball",
					basketball: "basketball-gm.com",
					football: "football-gm.com",
					hockey: "zengm.com/hockey",
				}),
			},
			{
				searchValue: "PLAY_SUBDOMAIN",
				replaceValue: bySport({
					baseball: "baseball.zengm.com",
					basketball: "play.basketball-gm.com",
					football: "play.football-gm.com",
					hockey: "hockey.zengm.com",
				}),
			},
			{
				searchValue: "BETA_SUBDOMAIN",
				replaceValue: bySport({
					baseball: "beta.baseball.zengm.com",
					basketball: "beta.basketball-gm.com",
					football: "beta.football-gm.com",
					hockey: "beta.hockey.zengm.com",
				}),
			},
		],
	});
};

export const copyFiles = async (watch: boolean = false) => {
	const foldersToIgnore = [
		"baseball",
		"basketball",
		"css",
		"football",
		"hockey",
	];

	await fsp.cp("public", "build", {
		filter: (filename) => {
			// Loop through folders to ignore.
			for (const folder of foldersToIgnore) {
				if (filename.startsWith(`public/${folder}`)) {
					return false;
				}
			}

			// Remove service worker, so I don't have to deal with it being wonky in dev
			if (watch && filename === "public/sw.js") {
				return false;
			}

			return true;
		},
		recursive: true,
	});

	let sport = process.env.SPORT;
	if (typeof sport !== "string") {
		sport = "basketball";
	}

	await fsp.cp(`public/${sport}`, "build", {
		filter: (filename) => !filename.includes(".gitignore"),
		recursive: true,
	});

	// Remove the empty folders created by the "filter" function.
	for (const folder of foldersToIgnore) {
		await fsp.rm(`build/${folder}`, { recursive: true, force: true });
	}

	const realPlayerFilenames = ["real-player-data", "real-player-stats"];
	for (const filename of realPlayerFilenames) {
		const sourcePath = `data/${filename}.${sport}.json`;
		if (fs.existsSync(sourcePath)) {
			await fsp.copyFile(sourcePath, `build/gen/${filename}.json`);
		}
	}

	await fsp.copyFile("data/names.json", "build/gen/names.json");
	await fsp.copyFile("data/names-female.json", "build/gen/names-female.json");

	await fsp.cp("node_modules/flag-icons/flags/4x3", "build/img/flags", {
		recursive: true,
	});
	const flagHtaccess = `<IfModule mod_headers.c>
	Header set Cache-Control "public,max-age=31536000"
</IfModule>`;
	await fsp.writeFile("build/img/flags/.htaccess", flagHtaccess);

	setSport();
};
