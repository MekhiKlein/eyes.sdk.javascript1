'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const {expect} = require('chai')
const stripAnsi = require('strip-ansi')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-failCypressAfterAllSpecs')

describe('CypressFailOnDiffAfterAllSpecs', () => {
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

  it('failCypressOnDiffAfterAllSpecs', async () => {
    const config = {...applitoolsConfig, failCypressAfterAllSpecs: true}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err, _v] = await presult(
      runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'helloworldDiffs.js',
        targetDir: targetTestAppPath,
      }),
    )
    const normalizedStdout = stripAnsi(err.stdout)
    expect(normalizedStdout).to.contain('✓ shows how to use Applitools Eyes with Cypress')
    expect(normalizedStdout).to.contain('Eyes-Cypress detected diffs')
  })
})
