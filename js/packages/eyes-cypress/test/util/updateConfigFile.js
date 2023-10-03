const fs = require('fs')
const path = require('path')

function updateConfigFile({pluginFileName, testFile, targetTestAppPath}) {
  const configFilePath = path.resolve(targetTestAppPath, `./cypress.config.js`)
  const contents = fs.readFileSync(configFilePath, 'utf-8')
  const replaced = contents
    .replace(/.\/cypress\/plugins\/index-run.js/g, `${targetTestAppPath}/cypress/plugins/${pluginFileName}`)
    .replace(/.\/cypress\/integration-run/g, `${targetTestAppPath}/cypress/integration-run/${testFile}`)
    .replace(/.\/cypress\/support\/e2e.js/g, `${targetTestAppPath}/cypress/support/e2e.js`)
  fs.writeFileSync(configFilePath, replaced)
}

module.exports = updateConfigFile
