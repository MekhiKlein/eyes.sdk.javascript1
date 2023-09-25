'use strict'
const {describe, it, before, after} = require('mocha') // eslint-disable-line
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const {runCypress} = require('../util/runCypress')
const stripAnsi = require('strip-ansi')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-getResults')
const targetDir = 'test/fixtures/testAppCopies/testApp-getResults'

function parseResults(stdout) {
  const results = stdout.substring(stdout.indexOf('@@START@@') + '@@START@@'.length, stdout.indexOf('@@END@@'))
  return JSON.parse(results)
}

describe('get results', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    try {
      await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    } catch (ex) {
      console.log(ex)
      throw ex
    }
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('return test results using eyesGetResults', async () => {
    const [err, v] = await presult(runCypress({pluginsFile: 'log-plugin.js', testFile: 'getResults.js', targetDir}))
    expect(err).to.be.undefined
    const [results] = parseResults(v.stdout)
    expect(results.appName).to.equal('test result 2')
    expect(results.name).to.equal('some test 2')
  })

  it('getResults fail test when throwErr is not false', async () => {
    const config = {...applitoolsConfig, failCypressOnDiff: false}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err, _v] = await presult(
      runCypress({
        pluginsFile: 'log-plugin.js',
        testFile: 'getResultsWithDiffs.js',
        targetDir,
      }),
    )
    const normalizedStdout = stripAnsi(err.stdout)
    expect(normalizedStdout).to.contain('✓ Test with diffs and throwErr set to false')
    expect(normalizedStdout).to.contain('1) Test with diffs and throwErr not set')
  })
})
