module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globals: {
    NODE_ENV: 'test'
  },
  modulePaths: [
    "<rootDir>"
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
