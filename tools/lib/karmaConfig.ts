import rollupConfig from "./rollupConfig.ts";
import browserstackLauncher from "karma-browserstack-launcher";
import chromeLauncher from "karma-chrome-launcher";
import firefoxLauncher from "karma-firefox-launcher";
import mocha from "karma-mocha";
import rollupPreprocessor from "karma-rollup-preprocessor";
// @ts-expect-error
import sourceMapSupport from "karma-source-map-support";

const files = ["src/test/mocha.ts", "src/test/smoke.ts"];

export default {
	plugins: [
		browserstackLauncher,
		chromeLauncher,
		firefoxLauncher,
		mocha,
		rollupPreprocessor,
		sourceMapSupport,
	],

	frameworks: ["mocha", "source-map-support"],

	files: files.map((pattern) => {
		return {
			pattern,
			watched: false,
		};
	}),

	preprocessors: {
		"src/**/*.{js,ts}": ["rollup"],
	},

	autoWatch: false,

	singleRun: true,

	rollupPreprocessor: {
		...rollupConfig("test"),
		output: {
			format: "iife",
			indent: false,
			name: "bbgm",
			sourcemap: true,
		},
	},

	browserNoActivityTimeout: 15 * 60 * 1000, // 15 minutes
	browserDisconnectTimeout: 15 * 60 * 1000, // 15 minutes

	browsers: ["ChromeHeadless", "FirefoxHeadless"],
};
