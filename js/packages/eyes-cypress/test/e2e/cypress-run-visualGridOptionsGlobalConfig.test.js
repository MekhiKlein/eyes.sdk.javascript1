'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const {expect} = require('chai')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-visualGridOptions-globalConfig')
const targetDir = 'test/fixtures/testAppCopies/testApp-visualGridOptions-globalConfig'

describe('works with visualGridOptions from global config', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works with visualGriedOptions from applitools.config file', async () => {
    const config = {...applitoolsConfig, visualGridOptions: {polyfillAdoptedStyleSheets: true}}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err, _stdout] = await presult(
      runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'visualGridOptionsGlobalConfig.js',
        targetDir,
        shouldRunFromRoot: true,
      }),
    )
    try {
      console.log(err)
      expect(err).to.be.undefined
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
