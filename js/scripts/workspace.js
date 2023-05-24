#!/usr/bin/env node

/* eslint "no-console": "off" */
const fs = require('fs').promises
const path = require('path')
const {execSync} = require('child_process')
const yargs = require('yargs')

yargs
  .command({
    command: 'prepare',
    builder: yargs =>
      yargs.options({
        links: {
          alias: ['l', 'link'],
          description: 'Package names to link',
          type: 'string',
          coerce: string => string.split(/[\s,]+/),
        },
      }),
    handler: async args => {
      try {
        await run(args)
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  })
  .wrap(yargs.terminalWidth()).argv

async function run({links}) {
  const packagePath = process.cwd()
  const packageManifestPath = path.resolve(packagePath, 'package.json')
  if (!(await fs.stat(packageManifestPath).catch(() => false))) {
    throw new Error(
      `Manifest file is not found in "${packageManifestPath}"! Please run this command in the package directory`,
    )
  }
  const manifest = JSON.parse(await fs.readFile(packageManifestPath, {encoding: 'utf8'}))
  const packages = await getPackages({packagesPath: path.resolve(packagePath, '..')})

  const currentPackage = packages[manifest.name]

  await processPackage({targetPackage: currentPackage})

  async function processPackage({targetPackage}) {
    if (targetPackage.processed) return
    targetPackage.processed = true
    if (links && links.length > 0) {
      const linkPackages = targetPackage.depPackageNames.flatMap(depPackageName => {
        const dependencyPackage = packages[depPackageName]
        const match = links.some(
          link =>
            dependencyPackage.name === link ||
            dependencyPackage.dirname === link ||
            (dependencyPackage.aliases && dependencyPackage.aliases.includes(link)) ||
            dependencyPackage.path === path.resolve(link),
        )
        return match ? dependencyPackage : []
      })

      for (const linkPackage of linkPackages) {
        await processPackage({targetPackage: linkPackage})
      }
      if (linkPackages.length > 0) {
        execSync(`npm link ${linkPackages.map(linkPackage => linkPackage.path).join(' ')}`, {cwd: targetPackage.path})
      } else {
        execSync(`npm install`, {cwd: targetPackage.path})
      }
    } else {
      execSync(`npm install`, {cwd: targetPackage.path})
    }
    execSync(`npm run build --if-exists`, {cwd: targetPackage.path})
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
