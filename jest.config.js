module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globals: {
    NODE_ENV: 'test'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
