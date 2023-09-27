'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const cypressConfig = require('../fixtures/testApp/cypress')
const {presult} = require('@applitools/functional-commons')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-global-hooks')
const targetDir = 'test/fixtures/testAppCopies/testApp-global-hooks'

describe('global hooks', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('works with experimentalRunEvents flag', async () => {
    const config = {...cypressConfig, experimentalRunEvents: true}
    fs.writeFileSync(`${targetTestAppPath}/cypress.json`, JSON.stringify(config, 2, null))
    const [err, _stdout] = await presult(
      runCypress({
        pluginsFile: 'global-hooks.js',
        testFile: 'fail.js',
        targetDir,
        cypressVersion: 6.5,
      }),
    )
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('does not fail without experimentalRunEvents flag', async () => {
    const config = {...cypressConfig, experimentalRunEvents: false}
    fs.writeFileSync(`${targetTestAppPath}/cypress.json`, JSON.stringify(config, 2, null))
    const [err, _stdout] = await presult(
      runCypress({
        pluginsFile: 'global-hooks.js',
        testFile: 'fail.js',
        targetDir,
        cypressVersion: 6.5,
      }),
    )
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('works with cypress version 4: < 6.2.0 no global hooks available', async () => {
    await pexec(`cd ${targetTestAppPath} && yarn && yarn add cypress@4`)
    const [err, _stdout] = await presult(
      runCypress({
        pluginsFile: 'global-hooks.js',
        testFile: 'fail.js',
        targetDir,
        cypressVersion: 4,
      }),
    )
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })

  it('works with cypress 6.7.0 or greater without flag', async () => {
    const [err, _stdout] = await presult(runCypress({pluginsFile: 'global-hooks.js', testFile: 'fail.js', targetDir}))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('Eyes-Cypress detected diffs or errors')
  })
})
