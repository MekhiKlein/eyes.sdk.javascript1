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
  const cypressVersionStr = cypressVersion.toString()
  if (cypressVersion >= 10) {
    return await runCypress10({targetDir, cypressVersion: cypressVersionStr})
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
        cypressVersion: cypressVersionStr,
        ...options,
      },
    )
  }
}

async function runCypress10({targetDir = process.cwd(), cypressVersion}) {
  const command = `../../node_modules/cypress10/bin/cypress`

  return (
    await pexec(`${command} run --config-file ${targetDir}/cypress.config.js`, {
      maxBuffer: 10000000,
      env: {APPLITOOLS_CONFIG_PATH: targetDir},
      workingDir: targetDir,
      cypressVersion,
    })
  ).stdout
}
module.exports = {runCypress}
