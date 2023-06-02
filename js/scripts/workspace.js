#!/usr/bin/env node

/* eslint "no-console": "off" */
const fs = require('fs').promises
const path = require('path')
const {execSync} = require('child_process')
const yargs = require('yargs')

yargs
  .command({
    command: 'install',
    builder: yargs =>
      yargs.options({
        target: {
          alias: ['t'],
          description: 'Target package path',
          type: 'string',
          demandOption: true,
        },
        links: {
          alias: ['l', 'link'],
          description: 'Package paths to link',
          type: 'string',
          coerce: string => string.split(/[\s,]+/),
        },
      }),
    handler: async args => {
      try {
        console.log(args)
        await install(args)
      } catch (err) {
        if (err.stdout) err.stdout = err.stdout.toString('utf8')
        if (err.stderr) err.stderr = err.stderr.toString('utf8')
        console.error(err)
        process.exit(1)
      }
    },
  })
  .wrap(yargs.terminalWidth()).argv

async function install({target, links}) {
  const packages = await getPackages({packagesPath: path.resolve('./packages')})
  const targetPackage = Object.values(packages).find(targetPackage => targetPackage.path === target)
  if (!targetPackage) {
    throw new Error(`This command can only run in the package directory, but the current directory is "${target}"`)
  }

  await installDependencies({currentPackage: targetPackage})

  async function installDependencies({currentPackage}) {
    if (currentPackage.processed) return
    currentPackage.processed = true
    console.log('installing in', currentPackage)

    const linkPackages = currentPackage.depPackageNames.flatMap(depPackageName => {
      const dependencyPackage = packages[depPackageName]
      const match = links?.some(link => {
        return dependencyPackage.name === link || dependencyPackage.path === path.resolve(targetPackage.path, link)
      })
      return match ? dependencyPackage : []
    })
    if (linkPackages.length > 0) {
      for (const linkPackage of linkPackages) {
        await installDependencies({currentPackage: linkPackage})
      }
      execSync(`npm link ${linkPackages.map(linkPackage => linkPackage.name).join(' ')}`, {cwd: currentPackage.path})
    } else {
      execSync(`npm install`, {cwd: currentPackage.path})
    }

    if (currentPackage !== targetPackage) {
      execSync(`npm link`, {cwd: currentPackage.path})
      execSync(`npm run build --if-present`, {cwd: currentPackage.path})
    }
  }
}

async function getPackages({packagesPath}) {
  const jsPackageDirs = await fs.readdir(packagesPath)
  const jsPackages = await jsPackageDirs.reduce(async (packages, packageDir) => {
    const packagePath = path.resolve(packagesPath, packageDir)
    const packageManifestPath = path.resolve(packagePath, 'package.json')
    if (!(await fs.stat(packageManifestPath).catch(() => false))) return packages
    const rawManifest = await fs.readFile(packageManifestPath, {encoding: 'utf8'})
    const manifest = JSON.parse(rawManifest)
    return {
      ...(await packages),
      [manifest.name]: {
        name: manifest.name,
        aliases: manifest.aliases,
        dirname: packageDir,
        path: packagePath,
        depPackageNames: Object.keys({...manifest.dependencies, ...manifest.devDependencies}),
      },
    }
  }, Promise.resolve({}))

  Object.values(jsPackages).forEach(packageInfo => {
    packageInfo.depPackageNames = packageInfo.depPackageNames.filter(depName => jsPackages[depName])
  })

  return jsPackages
}
