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
    await pexec(`cd ${targetTestAppPath} && yarn`, {
      maxBuffer: 1000000,
    })
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works with older versions without legacyHooks flag', async () => {
    await pexec(`cd ${targetTestAppPath} && yarn add cypress@6.0.0`, {
      maxBuffer: 1000000,
    })
    try {
      await runCypress({pluginsFile: 'index-run.js', testFile: 'simple.js', targetDir})
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })

  it('works with newer versions without legacyHooks flag', async () => {
    try {
      await pexec(`cd ${targetTestAppPath} && yarn add cypress@6.3.0`, {
        maxBuffer: 1000000,
      })
      await runCypress({pluginsFile: 'index-run.js', testFile: 'simple.js', targetDir})
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
