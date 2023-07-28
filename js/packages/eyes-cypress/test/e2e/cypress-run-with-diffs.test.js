'use strict'
const {describe, it, before, after} = require('mocha')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const {expect} = require('chai')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-run-wth-diffs')
const targetDir = 'test/fixtures/testAppCopies/testApp-run-wth-diffs'

describe('works for diffs with global hooks', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    try {
      await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)

      const packageJsonPath = path.resolve(targetTestAppPath, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))

      packageJson.devDependencies['cypress'] = '9.7.0'
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

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

  it('works for diffs with global hooks', async () => {
    const [err, _v] = await presult(
      runCypress({pluginsFile: 'global-hooks.js', testFile: 'helloworldDiffs.js', targetDir}),
    )
    expect(err.stdout).to.includes('Eyes-Cypress detected diffs')
  })
})
