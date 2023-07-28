'use strict'
const {describe, it, after} = require('mocha')
const {resolve} = require('path')
const fs = require('fs')
const path = require('path')

const rootPath = resolve(__dirname, '../..')
const rootPackageJson = require(resolve(rootPath, 'package.json'))
const pexec = require('../util/pexec')
const {runCypress} = require('../util/runCypress')

const sourceTestAppPath = path.resolve(__dirname, '../fixtures/testApp')
const targetTestAppPath = path.resolve(__dirname, '../fixtures/testAppCopies/testApp-pack-install')
const targetDir = 'test/fixtures/testAppCopies/testApp-pack-install'

describe('package and install', () => {
  let packageFilePath
  before(async () => {
    const {name, version} = rootPackageJson
    const packageName = name
      .split('/')
      .map(x => x.replace('@', ''))
      .join('-')

    packageFilePath = resolve(rootPath, `${packageName}-${version}.tgz`)
    debugger
    await pexec(`npm pack --prefix ${rootPath}`)

    if (fs.existsSync(targetTestAppPath)) {
      fs.rmdirSync(targetTestAppPath, {recursive: true})
    }
    await pexec(`cp -r ${sourceTestAppPath}/. ${targetTestAppPath}`)

    await pexec(`cd ${targetDir} && yarn `)
    await pexec(`cd ${targetDir} && yarn ${packageFilePath}`)
  })

  after(async () => {
    fs.rmdirSync(targetTestAppPath, {recursive: true})
    fs.unlinkSync(packageFilePath)
  })

  it('runs properly on installed package', async () => {
    try {
      await runCypress({
        pluginsFile: 'index-pack.js',
        testFile: 'pack.js',
        targetDir,
        supportFile: 'index-pack.js',
        integrationFolder: 'integration-pack',
      })
    } catch (ex) {
      console.error('Error!', JSON.stringify(ex))
      throw ex
    }
  })

  it('compiles with ts defenition file on installed package', async () => {
    const exampleFile = resolve(__dirname, `./ts-defs.example.ts --skipLibCheck true`)
    try {
      await pexec(`tsc ${exampleFile} --noEmit`, {
        maxBuffer: 10000000,
      })
    } catch (ex) {
      console.error('Typescript compiling error:', ex.stdout)
      throw 'Typescript compiling error'
    }
  })
})
