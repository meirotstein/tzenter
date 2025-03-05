module.exports = {
  preset: "ts-jest",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  testEnvironment: "node",
  verbose: true,
  setupFiles: ["<rootDir>/jest.setup.ts"],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
    }],
  },
};
