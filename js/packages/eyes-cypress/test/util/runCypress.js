const pexec = require('../util/pexec')
const {resolve} = require('path')

async function runCypress({
  pluginsFile,
  testFile,
  targetDir,
  options = {},
  xvfb = false,
  env = {},
  integrationFolder = 'integration-run',
  supportFile = 'index-run.js',
  cypressVersion = 9,
}) {
  let command,
    workingDir,
    commandConfig = `--headless --config testFiles=${testFile},integrationFolder=${targetDir}/cypress/${integrationFolder},pluginsFile=${targetDir}/cypress/plugins/${pluginsFile},supportFile=${targetDir}/cypress/support/${supportFile} --config-file ${targetDir}/cypress.json`
  const xvfbCommand = xvfb ? 'xvfb-run -a' : ''

  if (cypressVersion === 10) {
    command = `../../node_modules/cypress10/bin/cypress run`
    workingDir = targetDir
    commandConfig = `--config-file ${targetDir}/cypress.config.js`
  } else {
    if (cypressVersion < 6.5) {
      command = `${targetDir}/node_modules/.bin/cypress run`
      workingDir = resolve(`${process.cwd()}/${targetDir}`)
    } else {
      command = `../../node_modules/cypress${cypressVersion}/bin/cypress run`
      workingDir = resolve(`${process.cwd()}/../..`)
    }
  }

  return await pexec(`${xvfbCommand} ${command} ${commandConfig}`, {
    maxBuffer: 10000000,
    timeout: 100000,
    env: {APPLITOOLS_CONFIG_PATH: targetDir, ...env},
    workingDir,
    cypressVersion: cypressVersion.toString(),
    ...options,
  })
}
module.exports = {runCypress}
