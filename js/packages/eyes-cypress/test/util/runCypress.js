const pexec = require('../util/pexec')
const {resolve} = require('path')

async function runCypress({
  pluginsFile,
  testFile,
  targetDir = process.cwd(),
  options = {},
  xvfb = false,
  env = {},
  integrationFolder = 'integration-run',
  supportFile = 'index-run.js',
}) {
  let xvfbCommand = ''
  if (xvfb) {
    xvfbCommand = 'xvfb-run -a'
  }
  return await pexec(
    `${xvfbCommand} ${targetDir}/node_modules/.bin/cypress run --headless --config testFiles=${testFile},integrationFolder=${targetDir}/cypress/${integrationFolder},pluginsFile=${targetDir}/cypress/plugins/${pluginsFile},supportFile=${targetDir}/cypress/support/${supportFile} --config-file ${targetDir}/cypress.json`,
    {
      maxBuffer: 10000000,
      timeout: 60000,
      env: {APPLITOOLS_CONFIG_PATH: targetDir, ...env},
      workingDir: resolve(`${process.cwd()}/${targetDir}`),
      ...options,
    },
  )
}

async function runCypress10(targetDir = process.cwd()) {
  return (
    await pexec(`${targetDir}/node_modules/.bin/cypress run --config-file ${targetDir}/cypress.config.js`, {
      maxBuffer: 10000000,
      env: {APPLITOOLS_CONFIG_PATH: targetDir},
      workingDir: resolve(`${process.cwd()}/${targetDir}`),
    })
  ).stdout
}
module.exports = {runCypress, runCypress10}
