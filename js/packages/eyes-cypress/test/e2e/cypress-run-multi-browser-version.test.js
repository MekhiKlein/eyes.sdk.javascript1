'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-multi-browser-version')
const targetDir = 'test/fixtures/testAppCopies/testApp-multi-browser-version'

describe('multi-browser version', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works for multi-browser-version.js', async () => {
    try {
      await runCypress({
        pluginsFile: 'index-run.js',
        testFile: 'multi-browser-version.js',
        targetDir,
      })
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
