'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-parallel-run')
const targetDir = 'test/fixtures/testAppCopies/testApp-parallel-run'

describe('parallel run', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    try {
      await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)

      await pexec(`cd ${targetTestAppPath} && yarn`, {
        maxBuffer: 1000000,
      })
    } catch (ex) {
      console.log(ex)
      throw ex
    }
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works for parallel cypress runs', async () => {
    try {
      const runs = []
      runs.push(
        runCypress({pluginsFile: 'index-run.js', testFile: 'parallel-run-1.js', targetDir, options: {timeout: 60000}}),
      )
      runs.push(
        runCypress({
          pluginsFile: 'index-run.js',
          testFile: 'parallel-run-2.js',
          targetDir,
          xvfb: true,
          options: {timeout: 60000},
        }),
      )
      await Promise.all(runs)
    } catch (ex) {
      console.error('Error during test!', ex.stdout)
      throw ex
    }
  })
})
