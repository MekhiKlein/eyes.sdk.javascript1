import type {Job, Cache, Package} from './types.js'
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
  const useLink = core.getBooleanInput('link')
  const env = core.getInput('env')

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

  console.log(jobs)

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
            path: packagePath,
            tests: packageConfig.tests ?? [],
            builds: packageConfig.builds ?? [],
            releases: packageConfig.releases ?? [],
          }
          return packages
        })
      }
      return packages
    }, Promise.resolve({} as Record<string, Package>))
    return packages
  }

  function createJobs(input: string): {builds: Job[], tests: Job[], releases: Job[]} {
    const jobs = input.split(/[\s,]+(?=(?:[^()]*\([^())]*\))*[^()]*$)/).reduce((jobs, input) => {
      let [_, packageKey, frameworkVersion, langName, langVersion, runner, shortFrameworkVersion]
        = input.match(/^(.*?)(?:\((?:framework-version:([\d.]+);?)?(?:(node|python|java|ruby)-version:([\d.]+);?)?(?:runner:(linux|ubuntu|linuxarm|ubuntuarm|mac|macos|win|windows);?)?\))?(?:@([\d.]+))?$/i) ?? []
      frameworkVersion ??= shortFrameworkVersion
  
      const packageInfo = Object.values(packages).find(({name, path, component}) => [name, component, path].includes(packageKey))
      if (!packageInfo) {
        core.warning(`Package name is unknown! Package configured as "${input}" will be ignored!`)
        return jobs
      }

      const baseJob = {
        name: packageInfo.component,
        'display-name': packageInfo.component,
        'package-name': packageInfo.name,
        'artifact-name': `artifact-${packageInfo.component.replace(/\//g, '-')}`,
        'working-directory': packageInfo.path,
        runner: Runner[runner as keyof typeof Runner],
        [`${langName}-version`]: langVersion,
        [`framework-version`]: frameworkVersion,
        env: env.split(/[;\s]+/).reduce((envs, env) => {
          const [key, value] = env.split('=')
          return {...envs, [key]: value}
        }, {})
      }

      if (useCI) {
        packageInfo.tests.forEach(extension => {
          jobs.tests.push(makeJob(baseJob, {type: 'test', extension}))
        })
        packageInfo.builds.forEach(extension => {
          jobs.builds.push(makeJob(baseJob, {type: 'build', extension}))
        })
        packageInfo.releases.forEach(extension => {
          jobs.releases.push(makeJob(baseJob, {type: 'release', extension}))
        })
      }

      if (!useCI || packageInfo.tests.length === 0) {
        jobs.tests.push(makeJob(baseJob, {type: 'test'}))
      }

      return jobs
    }, {builds: [] as Job[], tests: [] as Job[], releases: [] as Job[]})

    if (useLink) {
      jobs.builds.forEach(job => {
        const links = jobs.builds.reduce((links, linkJob) => {
          if (linkJob.name !== job.name) {
            links.add(path.relative(job['working-directory'], linkJob['working-directory']))
          }
          return links
        }, new Set<string>())
        job.links = Array.from(links).join(' ')
      })

      jobs.tests.forEach(job => {
        const links = jobs.tests.reduce((links, linkJob) => {
          if (linkJob.name === job.name) return links
          links.add(path.relative(job['working-directory'], linkJob['working-directory']))
          return links
        }, new Set<string>())
        job.links = Array.from(links).join(' ')
        const caches = jobs.builds.flatMap(buildJob => {
          if (buildJob.name === job.name) return []
          return buildJob.cache ?? []
        })
        job.cache = caches.concat(job.cache ?? [])
      })
    }

    return jobs

    function makeJob(baseJob: Job, {type, extension}: {type: string, extension?: Partial<Job>}): Job {
      const job = {
        ...baseJob,
        ...extension,
        runner: extension?.runner ? (Runner[extension.runner as keyof typeof Runner] ?? extension.runner) : baseJob.runner,
        env: {...baseJob.env, ...extension?.env}
      }

      const description = Object.entries({
        runner: Object.keys(Runner).find(runner => Runner[runner as keyof typeof Runner] === job.runner) ?? job.runner,
        container: job.container,
        node: job['node-version'],
        java: job['java-version'],
        python: job['python-version'],
        ruby: job['ruby-version'],
        framework: job['framework-version'],
        [type]: job[`${type as 'build' | 'test'}-type`],
      })
        .flatMap(([key, value]) => value ? `${key}: ${value}` : [])
        .join(', ')
      job['display-name'] = `${job['display-name'] ?? job.name} ${description ? `(${description})` : ''}`.trim()

      job.cache &&= ([] as Cache[]).concat(job.cache).map(cache => ({
        key: cache.key.replace('{{hash}}', process.env.GITHUB_SHA ?? 'unknown').replace('{{component}}', job.name),
        path: cache.path.map(cachePath => path.join(job['working-directory'], cachePath))
      }))

      return job
    }
  }

  function getChangedPackagesInput(): string {
    const changedFiles = execSync(`git --no-pager diff --name-only origin/${process.env.GITHUB_BASE_REF || 'master'}`, {encoding: 'utf8'})
    const changedPackageNames = changedFiles.split('\n').reduce((changedPackageNames, changedFile) => {
      const changedPackage = Object.values(packages).find(changedPackage => {
        const changedPackagePath = path.resolve(process.cwd(), changedPackage.path)
        const changedFilePath = path.resolve(process.cwd(), changedFile, './')
        return changedFilePath.startsWith(changedPackagePath)
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
