#!/usr/bin/env node

/* eslint "no-console": "off" */
const fs = require('fs').promises
const path = require('path')
const {execSync} = require('child_process')
const yargs = require('yargs')

yargs
  .command({
    command: 'link <packages>',
    builder: yargs =>
      yargs.options({
        packages: {
          alias: ['p', 'package'],
          description: 'Package names to link',
          type: 'string',
          coerce: string => string.split(/[\s,]+/),
        },
        cwd: {
          description: 'Current working directory',
          type: 'string',
          default: process.cwd(),
        },
      }),
    handler: async args => {
      try {
        await link(args)
      } catch (err) {
        if (err.stdout) err.stdout = err.stdout.toString('utf8')
        if (err.stderr) err.stderr = err.stderr.toString('utf8')
        console.error(err)
        process.exit(1)
      }
    },
  })
  .wrap(yargs.terminalWidth()).argv

async function link({links, cwd}) {
  if (!links || links.length === 0) {
    console.log('No links provided')
    return
  }
  const packages = await getPackages({packagesPath: path.resolve(cwd, '..')})
  const currentPackage = packages.find(currentPackage => currentPackage.path === cwd)
  if (!(await fs.stat(packageManifestPath).catch(() => false))) {
    throw new Error(`This command can only run in the package directory, but the current directory is "${cwd}"`)
  }

  await linkDependencies({targetPackage: currentPackage})

  async function linkDependencies({targetPackage}) {
    if (targetPackage.processed) return
    targetPackage.processed = true
    if (targetPackage !== currentPackage) execSync(`npm ci`, {cwd: targetPackage.path})

    const linkPackages = targetPackage.depPackageNames.flatMap(depPackageName => {
      const dependencyPackage = packages[depPackageName]
      const match = links.some(link => {
        return dependencyPackage.name === link || dependencyPackage.path === path.resolve(cwd, link)
      })
      return match ? dependencyPackage : []
    })
    for (const linkPackage of linkPackages) {
      await linkDependencies({targetPackage: linkPackage})
    }
    execSync(`npm link ${linkPackages.map(linkPackage => linkPackage.path).join(' ')}`, {cwd: targetPackage.path})

    if (targetPackage !== currentPackage) execSync(`npm run build --if-present`, {cwd: targetPackage.path})
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
