'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-failed-fetch')
const targetDir = 'test/fixtures/testAppCopies/testApp-failed-fetch'

describe('failed-fetch', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works for failed-fetch.js', async () => {
    try {
      await runCypress({pluginsFile: 'index-run.js', testFile: 'failed-fetch.js', targetDir, shouldRunFromRoot: true})
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
