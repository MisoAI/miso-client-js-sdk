const path = require('path');

module.exports = {
  verbose: true,
  testEnvironment: 'node',
  globals: {
    NODE_ENV: 'test'
  },
  testMatch: [
    path.join(__dirname, 'packages/**/*.test.js')
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
