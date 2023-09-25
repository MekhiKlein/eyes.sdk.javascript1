'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const {runCypress10} = require('../util/runCypress')
const updateConfigFile = require('../util/updateConfigFile')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(
  __dirname,
  '../fixtures/testAppCopies/testApp-global-hooks-overrides-config-file',
)

function updateGlobalHooks(globalHooks) {
  let configContent = fs.readFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8')
  const content = configContent.replace(/setupNodeEvents\(on, config\) {/g, globalHooks)
  fs.writeFileSync(path.resolve(targetTestAppPath, `./cypress.config.js`), content, 'utf-8')
}

describe('global hooks override in cypress.config.js file', () => {
  beforeEach(async () => {
    fs.copyFileSync(
      `${__dirname}/../fixtures/cypressConfig-global-hooks-overrides-config-file.js`,
      `${targetTestAppPath}/cypress.config.js`,
    )
  })

  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
    await pexec(`cp ${sourceTestAppPath}Cypress10/cypress.config.js ${targetTestAppPath}`)
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

  it('supports running user defined global hooks from cypress.config.js file', async () => {
    await updateConfigFile({pluginFileName: 'index-run.js', testFile: 'global-hooks-overrides.js', targetTestAppPath})
    const globalHooks = `setupNodeEvents(on, config) {
      on('before:run', () => {
      console.log('@@@ before:run @@@');
      return null;
    });

    on('after:run', () => {
      console.log('@@@ after:run @@@');
      return null;
    });`
    updateGlobalHooks(globalHooks)
    const [err, output] = await presult(runCypress10({targetTestAppPath}))
    expect(err).to.be.undefined
    expect(output).to.contain('@@@ before:run @@@')
    expect(output).to.contain('@@@ after:run @@@')
  })
})
