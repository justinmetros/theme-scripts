module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: 'expect-puppeteer',
  testPathIgnorePatterns: ['.eslintrc.js'],
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.ts$": "ts-jest",
    '^.+\\.txt$': 'jest-raw-loader',
    '^.+\\.html$': 'jest-raw-loader'
  }
};
