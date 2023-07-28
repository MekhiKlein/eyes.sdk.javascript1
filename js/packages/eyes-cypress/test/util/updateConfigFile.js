const fs = require('fs')
const path = require('path')

async function updateConfigFile({pluginFileName, testFile, targetTestAppPath}) {
  const promise = new Promise(resolve => {
    fs.readFile(path.resolve(targetTestAppPath, `./cypress.config.js`), 'utf-8', function (err, contents) {
      if (err) {
        console.log(err)
        return
      }

      const replaced = contents
        .replace(/.\/cypress\/plugins\/index-run.js/g, `${targetTestAppPath}/cypress/plugins/${pluginFileName}`)
        .replace(/.\/cypress\/integration-run/g, `${targetTestAppPath}/cypress/integration-run/${testFile}`)
        .replace(/.\/cypress\/support\/e2e.js/g, `${targetTestAppPath}/cypress/support/e2e.js`)

      fs.writeFile(path.resolve(targetTestAppPath, `./cypress.config.js`), replaced, 'utf-8', function (err) {
        if (err) {
          console.log(err)
        }
        resolve()
      })
    })
  })
  await promise
}

module.exports = updateConfigFile
