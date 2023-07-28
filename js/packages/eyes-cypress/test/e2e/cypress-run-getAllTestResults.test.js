'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-getAllTestResults')
const targetDir = 'test/fixtures/testAppCopies/testApp-getAllTestResults'

describe('getAllTestResults', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    try {
      await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
      await pexec(`cd ${targetTestAppPath} && yarn`, {
        maxBuffer: 1000000,
      })
    } catch (ex) {
      console.log(ex)
      throw ex
    }
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('return test results for all managers', async () => {
    const [err, v] = await presult(
      runCypress({pluginsFile: 'log-plugin.js', testFile: 'getAllTestResults.js', targetDir}),
    )
    expect(err).to.be.undefined
    expect(v.stdout).to.contain('This is the first test')
    expect(v.stdout).to.contain('This is the second test')
  })

  it('return test results for all managers without duplicates', async () => {
    // removeDuplicateTests opted into in test/fixtures/testApp/applitools.config.js
    const [err, v] = await presult(
      runCypress({pluginsFile: 'log-plugin.js', testFile: 'getAllTestResultsWithDuplicates.js', targetDir}),
    )
    expect(err).to.be.undefined
    expect(v.stdout).to.contain('This is the first test')
    expect(v.stdout).to.contain('This is the second test')
    expect(v.stdout).to.contain('passed=2')
  })

  it('delete test results', async () => {
    const config = {...applitoolsConfig, showLogs: true}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err, v] = await presult(
      runCypress({pluginsFile: 'log-plugin.js', testFile: 'deleteTestResults.js', targetDir}),
    )
    expect(err).to.be.undefined
    expect(v.stdout).to.contain('Core.deleteTest')
  })
})
