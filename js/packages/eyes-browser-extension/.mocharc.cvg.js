const {mochaGrep} = require('@applitools/test-utils')

const tags = [
  'image',
  'headfull',
  'chrome',
]

module.exports = {
  spec: ['./test/generic/*.spec.js'],
  parallel: true,
  jobs: 2,
  timeout: 0,
  reporter: 'spec-xunit-file',
  grep: mochaGrep({tags}),
}
