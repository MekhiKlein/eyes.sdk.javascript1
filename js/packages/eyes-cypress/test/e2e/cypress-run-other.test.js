'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {expect} = require('chai')
const {msgText} = require('../../dist/plugin/concurrencyMsg').default
const concurrencyMsg = msgText.substr(0, 100)
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-other')
const targetDir = 'test/fixtures/testAppCopies/testApp-other'

describe('eyes configurations', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works with disabled eyes', async () => {
    try {
      const {stdout} = await runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'iframe.js',
        targetDir,
        integrationFolder: `integration-play`,
        env: {APPLITOOLS_IS_DISABLED: 1},
        shouldRunFromRoot: true,
      })
      expect(stdout, 'cypress ran with eyes disabled but concurrency msg is shown').to.not.have.string(concurrencyMsg)
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })

  it('does not fail Cypress test if failCypressOnDiff flag is false', async () => {
    try {
      await runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'always-fail.js',
        targetDir,
        integrationFolder: `integration-play`,
        env: {APPLITOOLS_FAIL_CYPRESS_ON_DIFF: false},
        shouldRunFromRoot: true,
      })
    } catch (ex) {
      console.error(
        'Test Failed even though failCypressOnDiff flag is false, If this is the first time u ran this test then u need to set up an invalid baseline for it.',
        ex.stdout,
      )
      throw ex
    }
  })
})
