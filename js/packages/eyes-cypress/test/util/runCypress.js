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
  cypressVersion = 9,
}) {
  if (cypressVersion >= 10) {
    runCypress10({targetTestAppPath: targetDir})
  } else {
    let command = `'../../node_modules/cypress${cypressVersion}/bin/cypress'`,
      workingDir = resolve(`${process.cwd()}/../..`)
    const xvfbCommand = xvfb ? 'xvfb-run -a' : ''
    if (cypressVersion < 6.5) {
      command = `${targetDir}/node_modules/.bin/cypress`
      workingDir = resolve(`${process.cwd()}/${targetDir}`)
    }

    return await pexec(
      `${xvfbCommand} ${command} run --headless --config testFiles=${testFile},integrationFolder=${targetDir}/cypress/${integrationFolder},pluginsFile=${targetDir}/cypress/plugins/${pluginsFile},supportFile=${targetDir}/cypress/support/${supportFile} --config-file ${targetDir}/cypress.json`,
      {
        maxBuffer: 10000000,
        timeout: 100000,
        env: {APPLITOOLS_CONFIG_PATH: targetDir, ...env},
        workingDir,
        cypressVersion: cypressVersion.toString(),
        ...options,
      },
    )
  }
}

async function runCypress10({targetTestAppPath = process.cwd()}) {
  const command = `../../node_modules/cypress10/bin/cypress`

  return (
    await pexec(`${command} run --config-file ${targetTestAppPath}/cypress.config.js`, {
      maxBuffer: 10000000,
      env: {APPLITOOLS_CONFIG_PATH: targetTestAppPath},
      workingDir: resolve(`${process.cwd()}/${targetTestAppPath}`),
    })
  ).stdout
}
module.exports = {runCypress}
