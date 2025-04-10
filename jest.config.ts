// module.exports = {
//   preset: "ts-jest",
//   testMatch: ["<rootDir>/tests/**/*.test.ts"],
//   testEnvironment: "node",
//   verbose: true,
//   setupFiles: ["<rootDir>/jest.setup.ts"],
//   transform: {
//     '^.+\\.ts$': ['ts-jest', {
//       tsconfig: 'tsconfig.json',
//       diagnostics: false,
//     }],
//   },
// };

// jest.config.ts
import type { Config } from 'jest';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' }); // Load test-specific environment variables

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Important: This must be 'setupFilesAfterEnv' not 'setupFiles'
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
            diagnostics: false,
        }],
    },
    moduleFileExtensions: ['ts', 'js'],
    verbose: true,
};

export default config;

