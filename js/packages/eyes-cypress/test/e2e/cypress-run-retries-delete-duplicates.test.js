'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-retries')
const targetDir = 'test/fixtures/testAppCopies/testApp-retries'

// skip this test for now as it's flaky on CI
describe('Retries', () => {
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

  it('remove duplicate tests on retry', async () => {
    const [err, _v] = await presult(
      runCypress({pluginsFile: 'log-plugin.js', testFile: 'retries.js', targetDir, shouldRunFromRoot: true}),
    )
    expect(err).to.be.undefined
  })
})
