/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tools"],
  testMatch: ["**/*.test.ts"],
  globalSetup: "<rootDir>/tools/spotify/jest.globalSetup.ts",
  clearMocks: true,
};
