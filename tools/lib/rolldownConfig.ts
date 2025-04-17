import fs from "node:fs/promises";
import { stripVTControlCharacters } from "node:util";
import babel from "@babel/core";
import type { RolldownPlugin, TransformResult, WatchOptions } from "rolldown";
// @ts-expect-error
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import { babelPluginSportFunctions } from "../babel-plugin-sport-functions/index.ts";
import { getSport, type Sport } from "./getSport.ts";
// @ts-expect-error
import blacklist from "rollup-plugin-blacklist";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";
import type { Plugin } from "rollup";

// Use babel to run babel-plugin-sport-functions. This is needed even in dev mode because the way bySport is defined, the sport-specific code will run if it's present, which can produce errors. It's not actually needed for isSport in dev mode.
const pluginSportFunctions = (
	nodeEnv: "development" | "production",
	sport: Sport,
): RolldownPlugin => {
	const babelCache: Record<
		string,
		| {
				mtimeMs: number;
				result: TransformResult;
		  }
		| undefined
	> = {};

	return {
		name: "sport-functions",
		transform: {
			filter: {
				// This screens out any node_modules code (should be .js) and .json or other non-TypeScript files. It originally was:
				//     id: { include: /\.tsx?$/ },
				// But in rolldown, any filter that matches means the whole thing matches, so it'd be like (id || code) when I want (id && code). Using an exclude filter for id makes it work how I want (only transform ts/tsx files containing bySport/isSport).
				// node_modules is just in case people start putting ts files on npm or something and I don't notice.
				id: {
					exclude: ["node_modules", /^((?!\.tsx?$).)*$/],
				},

				// This screens out any files that don't include bySport/isSport
				code: {
					include:
						nodeEnv === "production" ? ["bySport", "isSport"] : "bySport",
				},
			},
			async handler(code, id) {
				const { mtimeMs } = await fs.stat(id);
				const cached = babelCache[id];
				if (cached?.mtimeMs === mtimeMs) {
					return cached.result;
				}

				const babelResult = await babel.transformAsync(code, {
					babelrc: false,
					configFile: false,
					sourceMaps: true,
					plugins: [
						[babelPluginSyntaxTypescript, { isTSX: id.endsWith(".tsx") }],
						[babelPluginSportFunctions, { sport }],
					],
				});

				const result = {
					code: babelResult!.code!,
					map: babelResult!.map,
				};

				babelCache[id] = {
					mtimeMs,
					result,
				};

				return result;
			},
		},
	};
};

export const rolldownConfig = (
	name: "ui" | "worker",
	envOptions:
		| {
				nodeEnv: "development";
				postMessage: (message: any) => void;
		  }
		| {
				nodeEnv: "production";
				blacklistOptions: RegExp[];
		  },
): WatchOptions => {
	const infile = `src/${name}/index.${name === "ui" ? "tsx" : "ts"}`;
	const outfile = `build/gen/${name}.js`;
	const sport = getSport();

	const plugins: (Plugin | RolldownPlugin)[] = [
		pluginSportFunctions(envOptions.nodeEnv, sport),
	];

	if (envOptions.nodeEnv === "development") {
		plugins.push({
			name: "start-end",

			buildStart() {
				envOptions.postMessage({
					type: "start",
				});
			},

			async buildEnd(error) {
				if (error) {
					envOptions.postMessage({
						type: "error",
						error,
					});

					const js = `throw new Error(${JSON.stringify(stripVTControlCharacters(error.message))})`;
					await fs.writeFile(outfile, js);
				}
			},

			writeBundle() {
				envOptions.postMessage({
					type: "end",
				});
			},
		});
	} else {
		plugins.push(blacklist(envOptions.blacklistOptions));

		plugins.push(
			terser({
				format: {
					comments: false,
				},
			}),
		);

		plugins.push(
			visualizer({
				filename: `stats-${name}.html`,
				gzipSize: true,
				sourcemap: true,
				template: "sunburst",
			}),
		);
	}

	return {
		input: infile,
		output: {
			file: outfile,
			inlineDynamicImports: true,
			sourcemap: true,

			// ES modules don't work in workers in all the browsers currently supported, otherwise could use "es" everywhere. Also at that point could evaluate things like code splitting in the worker, or code splitting between ui/worker bundles (building them together)
			// Safari 15
			format: name === "ui" ? "es" : "iife",
		},
		jsx: "react-jsx",
		define: {
			"process.env.NODE_ENV": JSON.stringify(envOptions.nodeEnv),
			"process.env.SPORT": JSON.stringify(sport),
		},
		// @ts-expect-error
		plugins,
	};
};
