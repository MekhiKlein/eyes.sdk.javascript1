'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const {runCypress} = require('../util/runCypress')
const updateConfigFile = require('../util/updateConfigFile')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-global-hooks-overrides')

describe('global hooks override', () => {
  beforeEach(async () => {
    await pexec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
  })

  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    fs.unlinkSync(`${targetTestAppPath}/cypress.json`)
    const packageJsonPath = path.resolve(targetTestAppPath, 'package.json')

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))
    const latestCypressVersion = (await pexec('npm view cypress version')).stdout.trim()

    packageJson.devDependencies['cypress'] = latestCypressVersion
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it('supports running *sync* user defined global hooks', async () => {
    await updateConfigFile({
      pluginFileName: 'index-global-hooks-overrides-sync.js',
      testFile: 'global-hooks-overrides.js',
      targetTestAppPath,
    })
    const [err, output] = await presult(runCypress({targetDir: targetTestAppPath, cypressVersion: 10}))
    console.log(err)
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })

  it('supports running *async* user defined global hooks', async () => {
    await updateConfigFile({
      pluginFileName: 'index-global-hooks-overrides-sync.js',
      testFile: 'global-hooks-overrides.js',
      targetTestAppPath,
    })
    const [err, output] = await presult(runCypress({targetDir: targetTestAppPath, cypressVersion: 10}))
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })

  it('supports running user defined global hooks, when user throws error on before', async () => {
    await updateConfigFile({
      pluginFileName: 'index-global-hooks-overrides-error-before.js',
      testFile: 'global-hooks-overrides.js',
      targetTestAppPath,
    })
    const [err] = await presult(runCypress({targetDir: targetTestAppPath, cypressVersion: 10}))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('@@@ before:run error @@@')
    expect(err.stdout).not.to.contain('@@@ after:run @@@')
  })

  it('supports running user defined global hooks, when user throws error on after', async () => {
    await updateConfigFile({
      pluginFileName: 'index-global-hooks-overrides-error-after.js',
      testFile: 'global-hooks-overrides.js',
      targetTestAppPath,
    })
    const [err] = await presult(runCypress({targetDir: targetTestAppPath, cypressVersion: 10}))
    expect(err).not.to.be.undefined
    expect(err.stdout).to.contain('@@@ before:run @@@')
    expect(err.stdout).to.contain('@@@ after:run error @@@')
  })

  it('supports running user defined global hooks when only 1 hook is defined', async () => {
    await updateConfigFile({
      pluginFileName: 'index-global-hooks-overrides-only-after.js',
      testFile: 'helloworld.js',
      targetTestAppPath,
    })
    const [err, output] = await presult(runCypress({targetDir: targetTestAppPath, cypressVersion: 10}))
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ after:run @@@')
  })
})
