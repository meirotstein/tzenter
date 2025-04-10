import * as dotenv from "dotenv";
import type { Config } from "jest";

dotenv.config({ path: ".env.test" }); // Load test-specific environment variables

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // Important: This must be 'setupFilesAfterEnv' not 'setupFiles'
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        diagnostics: false,
        useESM: true,
      },
    ],
    // Transform hebcal lib ESM modules to CommonJS
    "^.+/node_modules/@hebcal/.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@hebcal/core|@hebcal/hdate|@hebcal/noaa)/)",
  ],
  moduleFileExtensions: ["ts", "js"],
  verbose: true,
};

export default config;
