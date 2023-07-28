'use strict'
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const path = require('path')
const pexec = require('../util/pexec')
const {promisify: p} = require('util')
const fs = require('fs')
const {presult} = require('@applitools/functional-commons')
const readFile = p(fs.readFile)
const applitoolsConfig = require('../fixtures/testApp/applitools.config.js')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-tapfile')
const targetDir = 'test/fixtures/testAppCopies/testApp-tapfile'

const readTapFile = async tapFilePath => {
  return await readFile(tapFilePath, 'utf8')
}

describe('tap file', () => {
  before(async () => {
    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
  })

  it(`supports creating '.tap' file from browser hooks`, async () => {
    await pexec(`cd ${targetTestAppPath} && yarn`, {
      maxBuffer: 1000000,
    })

    const helloWorldAppData = {
      appName: 'Hello World!',
      testName: 'My first JavaScript test!',
    }
    const outputLine = `[PASSED TEST] Test: '${helloWorldAppData.testName}', Application: '${helloWorldAppData.appName}'`
    const config = {...applitoolsConfig, tapDirPath: targetDir}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err] = await presult(runCypress({pluginsFile: 'index-run.js', testFile: 'helloworld.js', targetDir}))
    expect(err).to.be.undefined
    const dirCont = fs.readdirSync(targetTestAppPath)
    const files = dirCont.filter(function (elm) {
      return elm.match(/.*\.(tap?)/gi)
    })
    expect(files.length).to.equal(1, `Created ${files.length} .tap file(s)`)
    const tapFilePath = path.resolve(targetTestAppPath, files[0])
    const tapFileContent = await readTapFile(tapFilePath)
    expect(tapFileContent).to.include(outputLine, '.tap file content match')
    fs.unlinkSync(tapFilePath)
  })

  it(`supports creating '.tap' file from global hooks`, async () => {
    const packageJsonPath = path.resolve(targetTestAppPath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath))
    const latestCypressVersion = '9.7.0' //(await pexec('npm view cypress version')).stdout.trim();
    packageJson.devDependencies['cypress'] = latestCypressVersion
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    await pexec(`cd ${targetTestAppPath} && yarn`, {
      maxBuffer: 1000000,
    })

    const helloWorldAppData = {
      appName: 'Hello World!',
      testName: 'My first JavaScript test!',
    }
    const outputLine = `[PASSED TEST] Test: '${helloWorldAppData.testName}', Application: '${helloWorldAppData.appName}'`
    const config = {...applitoolsConfig, tapDirPath: targetTestAppPath}
    fs.writeFileSync(`${targetTestAppPath}/applitools.config.js`, 'module.exports =' + JSON.stringify(config, 2, null))
    const [err] = await presult(
      runCypress({
        pluginsFile: 'index-global-hooks-overrides-tap-dir.js',
        testFile: 'helloworld.js',
        targetDir,
      }),
    )
    expect(err).to.be.undefined
    const dirCont = fs.readdirSync(targetTestAppPath)
    const files = dirCont.filter(function (elm) {
      return elm.match(/.*\.(tap?)/gi)
    })
    expect(files.length).to.equal(1, `Created ${files.length} .tap file(s)`)
    const tapFilePath = path.resolve(targetTestAppPath, files[0])
    const tapFileContent = await readTapFile(tapFilePath)
    expect(tapFileContent).to.include(outputLine, '.tap file content match')
    fs.unlinkSync(tapFilePath)
  })
})
