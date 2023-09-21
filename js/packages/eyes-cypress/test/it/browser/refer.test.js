'use strict'
const {describe, it} = require('mocha')
const cypress = require('cypress')
const targetDir = `test/it/browser/fixtures/`
const cypressConfig = spec => {
  return {
    integrationFolder: 'test/it/browser/fixtures/cypress/integration',
    testFiles: `${spec}.spec.js`,
    video: false,
    screenshotOnRunFailure: false,
    pluginsFile: 'test/it/browser/fixtures/cypress/plugins/index-spec-driver-plugin.js',
    supportFile: 'test/it/browser/fixtures/cypress/support/index-spec-driver-support.js',
  }
}

describe('refer', () => {
  it('works for refer.spec.js', async () => {
    await runCypress('refer').then(results => {
      const tests = results.runs[0].tests
      for (const res of tests) {
        if (res.state != 'passed') {
          throw `${res.title[0]} finished with status ${res.state}`
        }
      }
    })
  })

  it.skip('playground', async () => {
    await openCypress()
  })
})

function runCypress(spec) {
  return cypress.run({
    browser: 'electron',
    headless: true,
    config: cypressConfig(spec),
    configFile: `${targetDir}/cypress.json`,
  })
}

function openCypress() {
  return cypress.open({
    browser: 'electron',
    config: cypressConfig(spec),
  })
}
