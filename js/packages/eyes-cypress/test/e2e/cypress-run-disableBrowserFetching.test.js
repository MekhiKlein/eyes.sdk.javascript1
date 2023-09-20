'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {runCypress10} = require('../util/runCypress')
const updateConfigFile = require('../util/updateConfigFile')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-disableBrowserFetching')

describe('disableBrowserFetching', () => {
  beforeEach(async () => {
    await pexec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
    const applitoolsConfig = require(path.resolve(targetTestAppPath, `./applitools.config.js`))
    applitoolsConfig.disableBrowserFetching = true
    fs.writeFileSync(
      path.resolve(targetTestAppPath, `./applitools.config.js`),
      `module.exports = ${JSON.stringify(applitoolsConfig)}`,
    )
  })
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    fs.unlinkSync(`${targetTestAppPath}/cypress.json`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works for disableBrowserFetching.js', async () => {
    try {
      await updateConfigFile({pluginFileName: 'index-run.js', testFile: 'disableBrowserFetching.js', targetTestAppPath})
      await runCypress10({targetTestAppPath, shouldRunFromRoot: true})
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
