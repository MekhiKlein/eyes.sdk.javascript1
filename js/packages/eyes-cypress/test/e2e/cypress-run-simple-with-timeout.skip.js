'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {testServerInProcess} = require('@applitools/test-server')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-simple-with-timeout')

describe('simple with middleware', () => {
  let closeServer
  before(async () => {
    const staticPath = path.resolve(__dirname, '../fixtures')
    const server = await testServerInProcess({
      port: 5555,
      staticPath,
      middlewares: ['slow'],
    })
    closeServer = server.close

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
    try {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    } finally {
      await closeServer()
    }
  })

  it('works for simple.js', async () => {
    try {
      await pexec(
        './node_modules/.bin/cypress run --headless --config testFiles=simple.js,integrationFolder=cypress/integration-run,pluginsFile=cypress/plugins/index-run.js,supportFile=cypress/support/index-run.js',
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
