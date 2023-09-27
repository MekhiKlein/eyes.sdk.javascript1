'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-legacyHooks')
const targetDir = 'test/fixtures/testAppCopies/testApp-legacyHooks'

describe('legacy hooks', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works without legacyHooks flag', async () => {
    try {
      await runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'simple.js',
        targetDir,
        cypressVersion: 6.5,
      })
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
