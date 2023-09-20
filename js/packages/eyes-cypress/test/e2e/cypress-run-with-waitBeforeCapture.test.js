'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-waitBeforeCapture')
const targetDir = 'test/fixtures/testAppCopies/testApp-waitBeforeCapture'

describe('works with waitBeforeCapture', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('waitBeforeCapture works from applitools.config file', async () => {
    const config = {...applitoolsConfig, waitBeforeCapture: 2500}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    try {
      await runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'waitBeforeCaptureConfigFile.js',
        targetDir,
        shouldRunFromRoot: true,
      })
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
