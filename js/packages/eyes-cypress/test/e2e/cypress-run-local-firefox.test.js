'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-local-firefox')
const targetDir = 'test/fixtures/testAppCopies/testApp-local-firefox'

// skipping this test for now, as cypress is flaky with FF and randomly is not able to start the test
describe.skip('hello world firefox', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    try {
      await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)

      await pexec(`cd ${targetTestAppPath} && yarn`, {
        maxBuffer: 1000000,
      })
      await pexec(`cd ${targetTestAppPath} && yarn add cypress@9`)
    } catch (ex) {
      console.log(ex)
      throw ex
    }
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works for helloworld.js with firefox', async () => {
    try {
      //testFiles=helloworld.js,
      await runCypress({pluginsFile: 'index-run.js', testFile: 'helloworld.js', targetDir})
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
