import type {Package, Job} from './types.js'
import {execSync} from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as core from '@actions/core'

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

main()

async function main() {
  let input = core.getInput('packages', {required: true}) 
  const useCI = core.getBooleanInput('ci')
  const env = core.getInput('env')
  const linkDependencies = core.getBooleanInput('link-dependencies')

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

  // core.info(`Requested jobs: "${Object.values(jobs).map(job => job.displayName).join(', ')}"`)

  core.setOutput('tests', jobs.tests)
  core.setOutput('builds', jobs.builds)
  core.setOutput('releases', jobs.releases)

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
            path: path.resolve(process.cwd(), packagePath),
            tag: `${packageConfig.component}@`,
            dependencies: Object.keys({...manifest.dependencies, ...manifest.devDependencies}),
            tests: (packageConfig.tests ?? [{}]).map(transformCache),
            builds: packageConfig.builds ?? [{}].map(transformCache),
            releases: packageConfig.releases ?? [{}].map(transformCache),
          }
          return packages
        })

        function transformCache(cacheable: {cache?: any}) {
          if (cacheable.cache) {
            const cache = (Array.isArray(cacheable.cache) ? cacheable.cache : [cacheable.cache]).map(cache => {
              return {
                ...cache,
                path: (cache.path as string[]).map(cachePath => path.resolve(packagePath, cachePath))
              }
            })
            cacheable.cache = {cache: JSON.stringify(cache)}
          }
          return cacheable
          
        }
      }
      return packages
    }, Promise.resolve({} as Record<string, Package>))
    Object.values(packages).forEach(packageInfo => {
      packageInfo.dependencies = packageInfo.dependencies.filter(depName => packages[depName])
    })
    return packages
  }

  function createJobs(input: string): {builds: Job[], tests: Job[], releases: Job[]} {
    return input.split(/[\s,]+(?=(?:[^()]*\([^())]*\))*[^()]*$)/).reduce((jobs, input) => {
      let [_, packageKey, frameworkVersion, langName, langVersion, runner, linkPackages, shortFrameworkVersion]
        = input.match(/^(.*?)(?:\((?:framework-version:([\d.]+);?)?(?:(node|python|java|ruby)-version:([\d.]+);?)?(?:runner:(linux|ubuntu|linuxarm|ubuntuarm|mac|macos|win|windows);?)?(?:links:(.+?);?)?\))?(?:@([\d.]+))?$/i) ?? []
      frameworkVersion ??= shortFrameworkVersion
  
      const packageInfo = Object.values(packages).find(({name, path, component}) => [name, component, path].includes(packageKey))
      if (!packageInfo) {
        core.warning(`Package name is unknown! Package configured as "${input}" will be ignored!`)
        return jobs
      }

      const params: Record<string, any> = {
        runner,
        [`${langName}-version`]: langVersion,
        [`framework-version`]: frameworkVersion,
        links: linkDependencies ? packageInfo.dependencies.join(',') : linkPackages,
        env: env.split(/[;\s]+/).reduce((envs, env) => {
          const [key, value] = env.split('=')
          return {...envs, [key]: value}
        }, {})
      }

      if (useCI) {
        packageInfo.tests.forEach(test => {
          const testParams = {...params, ...test, env: {...params.env, ...test.env}} as any
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
          jobs.tests.push({
            name: packageInfo.component,
            'display-name': `${packageInfo.component}${description ? ` (${description})` : ''}`,
            'package-name': packageInfo.name,
            'artifact-name': `artifact-${packageInfo.component.replace(/\//g, '-')}`,
            path: packageInfo.path,
            tag: packageInfo.tag,
            ...testParams,
            runner: Runner[testParams.runner as keyof typeof Runner],
            requested: true,
          })
        })

        packageInfo.builds.forEach(build => {
          const buildParams = {...params, ...build, env: {...params.env, ...build.env}} as any
          const description = buildParams.name
          jobs.tests.push({
            name: packageInfo.component,
            'display-name': `${packageInfo.component}${description ? ` (${description})` : ''}`,
            'package-name': packageInfo.name,
            'artifact-name': `artifact-${packageInfo.component.replace(/\//g, '-')}`,
            path: packageInfo.path,
            tag: packageInfo.tag,
            ...buildParams,
            runner: Runner[buildParams.runner as keyof typeof Runner],
            requested: true,
          })
        })

        packageInfo.releases.forEach(release => {
          const releaseParams = {...params, ...release, env: {...params.env, ...release.env}} as any
          const description = releaseParams.name
          jobs.tests.push({
            name: packageInfo.component,
            'display-name': `${packageInfo.component}${description ? ` (${description})` : ''}`,
            'package-name': packageInfo.name,
            'artifact-name': `artifact-${packageInfo.component.replace(/\//g, '-')}`,
            path: packageInfo.path,
            tag: packageInfo.tag,
            ...releaseParams,
            runner: Runner[releaseParams.runner as keyof typeof Runner],
            requested: true,
          })
        })
      } else {
        packageInfo.tests.forEach(test => {
          const testParams = {...params, ...test, env: {...params.env, ...test.env}} as any
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
          jobs.tests.push({
            name: packageInfo.component,
            'display-name': `${packageInfo.component}${description ? ` (${description})` : ''}`,
            'package-name': packageInfo.name,
            'artifact-name': `artifact-${packageInfo.component.replace(/\//g, '-')}`,
            path: packageInfo.path,
            tag: packageInfo.tag,
            ...testParams,
            runner: Runner[testParams.runner as keyof typeof Runner],
            requested: true,
          })
        })
      }
    
      return jobs
    }, {builds: [] as Job[], tests: [] as Job[], releases: [] as Job[]})
  }

  // function createDependencyJobs(jobs: Job[]) {
  //   const packageNames = jobs.map(job => job.packageName)
  //   const dependencyJobs = [] as Job[]
  
  //   for (const packageName of packageNames) {
  //     for (const dependencyName of packages[packageName].dependencies) {
  //       if (packageNames.includes(dependencyName)) continue
  //       packageNames.push(dependencyName)
  //       dependencyJobs.push({
  //         name: packages[dependencyName].component,
  //         displayName: packages[dependencyName].component,
  //         packageName: packages[dependencyName].name,
  //         artifactName: `artifact-${packages[dependencyName].component.replace(/\//g, '-')}`,
  //         path: packages[dependencyName].path,
  //         tag: packages[dependencyName].tag,
  //         params: {
  //           links: linkDependencies ? packages[dependencyName].dependencies.join(',') : undefined,
  //         },
  //         requested: false
  //       })
  //     }
  //   }
  
  //   return dependencyJobs
  // }

  // function filterInsignificantJobs(jobs: Job[]) {
  //   const filteredJobs = jobs.filter(job => job.requested || changedSinceLastTag(job))
  
  //   let more = true
  //   while (more) {
  //     more = false
  //     for (const job of jobs) {
  //       if (filteredJobs.some(filteredJob => filteredJob.name === job.name)) continue
  //       if (packages[job.packageName].dependencies.some(packageName => Object.values(filteredJobs).some(job => job.packageName === packageName))) {
  //         more = true
  //         filteredJobs.push(job)
  //       }
  //     }
  //   }
  
  //   return filteredJobs
  // }

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
    console.log(changedFiles)
    const changedPackageNames = changedFiles.split('\n').reduce((changedPackageNames, changedFile) => {
      const changedPackage = Object.values(packages).find(changedPackage => {
        const changedFilePath = path.resolve(process.cwd(), changedFile, './')
        console.log(changedFilePath, changedPackage.path + '/')
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
