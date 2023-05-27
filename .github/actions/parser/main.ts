import type {Package, Job} from './types.js'
import {execSync} from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as core from '@actions/core'
import INI from 'ini'

enum Runner {
  linux = 'ubuntu-latest',
  ubuntu = 'ubuntu-latest',
  linuxarm = 'buildjet-2vcpu-ubuntu-2204-arm',
  ubuntuarm = 'buildjet-2vcpu-ubuntu-2204-arm',
  mac = 'macos-latest',
  macos = 'macos-latest',
  win = 'windows-2022',
  windows = 'windows-2022',
}

const SKIP_PACKAGES = [
  // tools
  '@applitools/bongo',
  '@applitools/sdk-coverage-tests',
  '@applitools/api-extractor',
  '@applitools/snaptdout',
  '@applitools/fancy',
  // legacy
  '@applitools/visual-grid-client',
  '@applitools/types',
  '@applitools/sdk-fake-eyes-server',
  '@applitools/eyes-sdk-core',
  '@applitools/eyes-universal',
  '@applitools/eyes-selenium-universal',
  '@applitools/eyes-playwright-universal',
  '@applitools/eyes-webdriverio5-service',
  '@applitools/eyes.webdriverio',
  '@applitools/eyes-protractor',
  'applitools-for-selenium-ide',
]

main()

async function main() {
  let input = core.getInput('packages', {required: true}) 
  const defaultEnv = core.getInput('env')
  const includeOnlyChanged = core.getBooleanInput('include-only-changed')
  const includeDependencies = core.getBooleanInput('include-dependencies')
  const linkDependencies = core.getBooleanInput('link-dependencies')
  const defaultUseMatrix = core.getBooleanInput('use-matrix')

  const packages = await getPackages()

  if (input === 'changed') {
    input = getChangedPackagesInput()
    core.notice(`Changed packages: "${input}"`)
  } else if (input === 'all') {
    input = getAllPackagesInput()
    core.notice(`All packages: "${input}"`)
  } else {
    core.notice(`Input provided: "${input}"`)
  }

  let jobs = createJobs(input)

  core.info(`Requested jobs: "${Object.values(jobs).map(job => job.displayName).join(', ')}"`)

  if (includeDependencies) {
    const additionalJobs = createDependencyJobs(jobs)
    jobs = {...jobs, ...additionalJobs}
    core.info(`Requested and dependant jobs: "${Object.values(jobs).map(job => job.displayName).join(', ')}"`)
  }

  if (includeOnlyChanged) {
    jobs = filterInsignificantJobs(jobs)
    core.info(`Filtered jobs: "${Object.values(jobs).map(job => job.displayName).join(', ')}"`)
  }

  core.setOutput('packages', jobs)

  async function getPackages(): Promise<Record<string, Package>> {
    const releaseConfigPath = path.resolve(process.cwd(), './release-please-config.json')
    const releaseConfig = JSON.parse(await fs.readFile(releaseConfigPath, {encoding: 'utf8'}))
    const packages = await Object.entries(releaseConfig.packages as Record<string, any>).reduce(async (packages, [packagePath, packageConfig]) => {
      if (packagePath.startsWith('js/')) {
        const packageManifestPath = path.resolve(packagePath, 'package.json')
        const manifest = JSON.parse(await fs.readFile(packageManifestPath, {encoding: 'utf8'}))

        return packages.then(packages => {
          packages[manifest.name] = {
            name: manifest.name,
            component: packageConfig.component,
            path: packagePath,
            tag: `${packageConfig.component}@`,
            dependencies: Object.keys({...manifest.dependencies, ...manifest.devDependencies}),
            framework: Object.keys({...manifest.peerDependencies})[0],
            matrix: packageConfig.matrix,
          }
          return packages
        })
      }
      return packages
    }, Promise.resolve({} as Record<string, Package>))
    Object.values(packages).forEach(packageInfo => {
      packageInfo.dependencies = packageInfo.dependencies.filter(depName => packages[depName])
    })
  
    // const pyPackagesPath = path.resolve(process.cwd(), './python')
    // const pyPackageDirs = await fs.readdir(pyPackagesPath)
    // const pyPackages = await pyPackageDirs.reduce(async (packages, packageDir) => {
    //   const packagePath = path.resolve(pyPackagesPath, packageDir)
    //   const packageManifestPath = path.resolve(packagePath, 'setup.cfg')
    //   if (!(await fs.stat(packageManifestPath).catch(() => false))) return packages
  
    //   const {iniString} = await fs.readFile(packageManifestPath, {encoding: 'utf8'}).then(iniString => {
    //     return iniString.split(/[\n\r]+/).reduce(({lastField, iniString}, line) => {
    //       const indent = line.slice(0, Array.from(line).findIndex(char => char !== ' ' && char !== '\t'))
    //       if (!lastField || indent.length <= lastField.indent.length) {
    //         const [key] = line.split(/\s?=/, 1)
    //         lastField = {key, indent}
    //         iniString += line + '\n'
    //       } else {
    //         iniString += lastField.indent + `${lastField.key}[]=` + line.trim() + '\n'
    //       }
    //       return {lastField, iniString}
    //     }, {lastField: null as null | {key: string, indent: string}, iniString: ''})
    //   })
    //   const manifest = INI.parse(iniString) as any
  
    //   return packages.then(packages => {
    //     const packageName = manifest.metadata.name.replace('_', '-')
    //     const alias = packageName.replace('eyes-', '')
    //     const dependencies = (manifest.options.install_requires ?? []) as string[]
    //     packages[packageName] = {
    //       name: packageName,
    //       jobName: `python-${alias}`,
    //       aliases: [`py-${alias}`, `python-${alias}`],
    //       dirname: packageDir,
    //       path: packagePath,
    //       tag: `@applitools/python/${packageDir}@`,
    //       dependencies: dependencies.map(depString => depString.split(/[<=>]/, 1)[0])
    //     }
    //     return packages
    //   })
    // }, Promise.resolve({} as Record<string, Package>))
    // Object.values(pyPackages).forEach(packageInfo => {
    //   packageInfo.dependencies = packageInfo.dependencies.filter(depName => pyPackages[depName])
    // })
  
    // pyPackages['core-universal'].dependencies.push('@applitools/core')
  
    return packages
  }

  function createJobs(input: string): Job[] {
    return input.split(/[\s,]+(?=(?:[^()]*\([^())]*\))*[^()]*$)/).reduce((jobs, input) => {
      let [_, packageKey, priorityUseMatrix, frameworkVersion, langName, langVersion, runner, linkPackages, shortFrameworkVersion]
        = input.match(/^(.*?)(?:\((?:matrix:(true|false);?)(?:framework-version:([\d.]+);?)?(?:(node|python|java|ruby)-version:([\d.]+);?)?(?:runner:(linux|ubuntu|linuxarm|ubuntuarm|mac|macos|win|windows);?)?(?:links:(.+?);?)?\))?(?:@([\d.]+))?$/i) ?? []
      frameworkVersion ??= shortFrameworkVersion
      const useMatrix = priorityUseMatrix ? priorityUseMatrix === 'true' : defaultUseMatrix 
  
      const packageInfo = Object.values(packages).find(({name, path, component}) => {
        return [name, component, path].includes(packageKey)
      })
    
      if (!packageInfo) {
        core.warning(`Package name is unknown! Package configured as "${input}" will be ignored!`)
        return jobs
      }
    
      const envs = defaultEnv.split(/[;\s]+/).reduce((envs, env) => {
        const [key, value] = env.split('=')
        return {...envs, [key]: value}
      }, {})
  

      const params: Record<string, any> = {
        runner,
        [`${langName}-version`]: langVersion,
        [`framework-version`]: frameworkVersion,
        links: linkDependencies ? packageInfo.dependencies.join(',') : linkPackages,
        env: {
          [`APPLITOOLS_FRAMEWORK_MAJOR_VERSION`]: frameworkVersion,
          [`APPLITOOLS_FRAMEWORK_VERSION`]: frameworkVersion,
          ...envs,
        },
      }

      const matrix = useMatrix && packageInfo.matrix?.map(matrixParams => ({...params, ...matrixParams, env: {...params.env, ...matrixParams.env}})) || [params]
      matrix.forEach(params => {
        const description = [
          params.runner && `runner: ${params.runner}`,
          params.container && `container: ${params.container}`,
          params['node-version'] && `node: ${params['node-version']}`,
          params['java-version'] && `java: ${params['java-version']}`,
          params['python-version'] && `python: ${params['python-version']}`,
          params['ruby-version'] && `ruby: ${params['ruby-version']}`,
          params['framework-version'] && `framework: ${params['framework-version']}`,
          params['test-type'] && `test: ${params['test-type']}`,
        ].filter(Boolean).join(', ')
        const displayName = `${packageInfo.component}${description ? ` (${description})` : ''}`
        jobs.push({
          name: packageInfo.component,
          displayName,
          packageName: packageInfo.name,
          artifactName: `artifact-${packageInfo.component.replace(/\//g, '-')}`,
          path: packageInfo.path,
          tag: packageInfo.tag,
          params: {...params, runner: Runner[params.runner as keyof typeof Runner]},
          requested: true,
        })
      })
    
      return jobs
    }, [] as Job[])
  }

  function createDependencyJobs(jobs: Job[]) {
    const packageNames = jobs.map(job => job.packageName)
    const dependencyJobs = [] as Job[]
  
    for (const packageName of packageNames) {
      for (const dependencyName of packages[packageName].dependencies) {
        if (packageNames.includes(dependencyName)) continue
        packageNames.push(dependencyName)
        dependencyJobs.push({
          name: packages[dependencyName].component,
          displayName: packages[dependencyName].component,
          packageName: packages[dependencyName].name,
          artifactName: `artifact-${packages[dependencyName].component.replace(/\//g, '-')}`,
          path: packages[dependencyName].path,
          tag: packages[dependencyName].tag,
          params: {
            links: linkDependencies ? packages[dependencyName].dependencies.join(',') : undefined,
          },
          requested: false
        })
      }
    }
  
    return dependencyJobs
  }

  function filterInsignificantJobs(jobs: Job[]) {
    const filteredJobs = jobs.filter(job => job.requested || changedSinceLastTag(job))
  
    let more = true
    while (more) {
      more = false
      for (const job of jobs) {
        if (filteredJobs.some(filteredJob => filteredJob.name === job.name)) continue
        if (packages[job.packageName].dependencies.some(packageName => Object.values(filteredJobs).some(job => job.packageName === packageName))) {
          more = true
          filteredJobs.push(job)
        }
      }
    }
  
    return filteredJobs
  }

  function changedSinceLastTag(job: Job) {
    let tag
    try {
      tag = execSync(`git describe --tags --match "${job.tag}*" --abbrev=0`, {encoding: 'utf8'}).trim()
    } catch {}
  
    if (!tag) return true
  
    const commits = execSync(`git log ${tag}..HEAD --oneline -- ${job.path}`, {encoding: 'utf8'})
    return Boolean(commits)
  }

  function getChangedPackagesInput(): string {
    const changedFiles = execSync(`git --no-pager diff --name-only origin/${process.env.GITHUB_BASE_REF || 'master'}`, {encoding: 'utf8'})
    const changedPackageNames = changedFiles.split('\n').reduce((changedPackageNames, changedFile) => {
      const changedPackage = Object.values(packages).find(changedPackage => {
        const changedFilePath = path.resolve(process.cwd(), changedFile, './')
        return changedFilePath.startsWith(changedPackage.path + '/')
      })
      if (changedPackage) changedPackageNames.add(changedPackage.component)
      return changedPackageNames
    }, new Set())
    return Array.from(changedPackageNames.values()).join(' ')
  }

  function getAllPackagesInput(): string {
    return Object.values(packages).map(({component}) => component).join(' ')
  }
}
