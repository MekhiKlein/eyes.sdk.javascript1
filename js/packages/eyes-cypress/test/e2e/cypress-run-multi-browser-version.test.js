'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-multi-browser-version')

describe('multi-browser version', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    process.chdir(targetTestAppPath)
    await pexec(`yarn`, {
      maxBuffer: 1000000,
    })
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works for multi-browser-version.js', async () => {
    try {
      await pexec(
        './node_modules/.bin/cypress run --headless --config testFiles=multi-browser-version.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
        {
          maxBuffer: 10000000,
        },
      )
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
