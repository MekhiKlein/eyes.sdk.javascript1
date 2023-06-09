import type {Job, Artifact, Package} from './types.js'
import {execSync} from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as core from '@actions/core'

enum Runner {
  linux = 'ubuntu-latest',
  ubuntu = 'ubuntu-latest',
  linuxarm = 'buildjet-2vcpu-ubuntu-2204-arm',
  ubuntuarm = 'buildjet-2vcpu-ubuntu-2204-arm',
  macos = 'macos-latest',
  mac = 'macos-latest',
  windows = 'windows-2022',
  win = 'windows-2022',
}

main()
  .catch(err => {
    core.debug(err)
    core.setFailed(err.message)
  })

async function main() {
  const packages = await getPackages()
  const envs = core.getInput('env').split(/[;\s]+/).reduce((envs, env) => {
    const [key, value] = env.split('=')
    return {...envs, [key]: value}
  }, {})

  const ci = core.getBooleanInput('ci')
  const tags = core.getMultilineInput('tag').flatMap(artifact => artifact.split(','))
  const release = tags.length > 0

  let input: string
  if (ci) {
    input = getChangedPackagesInput()
    core.notice(`Changed packages: "${input}"`)
  } else if (release) {
    input = getPackagesInputFromTags(tags)
    input = getChangedPackagesInput()
  } else {
    input = core.getInput('packages') 
    core.notice(`Requested packages: "${input}"`)
  }

  let jobs = createJobs(input)

  core.debug(JSON.stringify(jobs, null, 2))

  if (jobs.builds.length > 0) {
    core.info(`Build jobs: "${Object.values(jobs.builds).map(job => job['display-name']).join(', ')}"`)
    core.setOutput('builds', jobs.builds)
  }
  if (jobs.tests.length > 0) {
    core.info(`Test jobs: "${Object.values(jobs.tests).map(job => job['display-name']).join(', ')}"`)
    core.setOutput('tests', jobs.tests)
  }
  if (jobs.releases.length > 0) {
    core.info(`Release jobs: "${Object.values(jobs.releases).map(job => job['display-name']).join(', ')}"`)
    core.setOutput('releases', jobs.releases)
  }

  async function getPackages(): Promise<Record<string, Package>> {
    const releaseConfigPath = path.resolve(process.cwd(), './release-please-config.json')
    const releaseConfig = JSON.parse(await fs.readFile(releaseConfigPath, {encoding: 'utf8'}))
    const packages = await Object.entries(releaseConfig.packages as Record<string, any>).reduce(async (packages, [packagePath, packageConfig]) => {
      if (packageConfig.component.startsWith('js/')) {
        const packageManifestPath = path.resolve(packagePath, 'package.json')
        const manifest = JSON.parse(await fs.readFile(packageManifestPath, {encoding: 'utf8'}))
        return packages.then(packages => {
          packages[manifest.name] = {
            name: manifest.name,
            version: manifest.version,
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
        'package-version': packageInfo.version,
        'working-directory': packageInfo.path,
        runner: Runner[runner as keyof typeof Runner],
        [`${langName}-version`]: langVersion,
        [`framework-version`]: frameworkVersion,
        env: envs
      }

      if (ci) {
        packageInfo.builds.forEach(extension => {
          jobs.builds.push(makeJob(baseJob, {type: 'build', extension}))
        })
        packageInfo.tests.forEach(extension => {
          if (packageInfo.builds.length > 0) extension['build-type'] ??= 'none'
          jobs.tests.push(makeJob(baseJob, {type: 'test', extension}))
        })
      }

      if (release) {
        packageInfo.builds.forEach(extension => {
          jobs.builds.push(makeJob(baseJob, {type: 'build', extension}))
        })
        packageInfo.releases.forEach(extension => {
          jobs.releases.push(makeJob(baseJob, {type: 'release', extension}))
        })
      }

      if (!release && (!ci || packageInfo.tests.length === 0)) {
        jobs.tests.push(makeJob(baseJob, {type: 'test'}))
      }

      return jobs
    }, {builds: [] as Job[], tests: [] as Job[], releases: [] as Job[]})

    if (ci) {
      jobs.tests.forEach(populateRestore)
    } else if (release) {
      jobs.releases.forEach(populateRestore)
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

      if (job.save) {
        job.save.cache &&= {
          key: populateString(job.save.cache.key),
          path: job.save.cache.path.map(cachePath => path.join(job['working-directory'], cachePath))
        }
        job.save.artifact &&= {
          key: populateString(job.save.artifact.key, {filenamify: true}),
          path: job.save.artifact.path.map(artifactPath => path.join(job['working-directory'], artifactPath))
        }
      }
      if (job.restore) {
        job.restore.cache &&= job.restore.cache.map(cache => {
          return typeof cache === 'string'
            ? populateString(cache)
            : {
              key: populateString(cache.key),
              path: cache.path.map(cachePath => path.join(job['working-directory'], cachePath))
            }
        })
        job.restore.artifact &&= job.restore.artifact.map(artifact => {
          return typeof artifact === 'string'
            ? populateString(artifact, {filenamify: true})
            : {
              key: populateString(artifact.key, {filenamify: true}),
              path: artifact.path.map(artifactPath => path.join(job['working-directory'], artifactPath))
            }
        })
      }


      return job

      function populateString(string: string, options?: {filenamify: boolean}): string {
        let result = string
          .replace(/\{\{([^}]+)\}\}/g, (_, name) => {
            if (name === 'hash') return process.env.GITHUB_SHA ?? 'unknown'
            else if (name === 'component') return job.name
            else return job[name as keyof Job] as string
          })
        if (options?.filenamify) {
          result = result.replace(/\//g, '-')
        }
        return result
      }
    }

    function populateRestore(job: Job) {
      const defaultRestore = jobs.builds.reduce((restore, buildJob) => {
        if (buildJob.name === job.name && buildJob.save) {
          if (buildJob.save.cache) (restore.cache ??= []).push(buildJob.save.cache)
          if (buildJob.save.artifact) (restore.artifact ??= []).push(buildJob.save.artifact)
        }
        return restore
      }, {} as {cache?: Artifact[], artifact?: Artifact[]})
      if (job.restore) {
          job.restore.cache &&= job.restore.cache.flatMap(cache => {
            return typeof cache === 'string'
              ? defaultRestore.cache?.find(defaultCache => defaultCache.key === cache) ?? []
              : cache
          })
          job.restore.artifact &&= job.restore.artifact.flatMap(artifact => {
            return typeof artifact === 'string'
              ? defaultRestore.artifact?.find(defaultArtifact => defaultArtifact.key === artifact) ?? []
              : artifact
          })
      } else {
        job.restore = defaultRestore
      }
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

  function getPackagesInputFromTags(tags: string[]): string {
    return tags.map(tag => tag.replace(/@[^@]+$/, '')).join(' ')
  }

  function getAllPackagesInput(): string {
    return Object.values(packages).map(({component}) => component).join(' ')
  }
}
