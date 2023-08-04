import {existsSync} from 'node:fs'
import {execSync} from 'node:child_process'
import {setTimeout} from 'node:timers/promises'
import {restoreCache} from '@actions/cache'
import * as core from '@actions/core'

if (process.platform === 'linux' && existsSync('/etc/alpine-release')) {
  core.debug('alpine system is detected, installing necessary dependencies')
  execSync('apk add --no-cache zstd tar')
}

main()
  .then(results => {
    core.debug(`successfully restored caches ${results}`)
  })
  .catch(err => {
    core.error(err)
    core.setFailed(err.message)
  })

async function main(): Promise<(string | undefined)[]> {
  const names = core.getMultilineInput('name', {required: true}).flatMap(name => name ? name.split(/[\s\n,]+/) : [])
  const latest = core.getBooleanInput('latest')
  const wait = core.getBooleanInput('wait')
  return Promise.all(names.map(async compositeName => {
    const [name, paths] = compositeName.split('$')
    const fallbacks = latest ? [name.replace(/(?<=#).+$/, '')] : []

    return restore({paths: paths.split(';'), name, fallbacks, wait: wait ? 0 : 600_000})
  }))

  async function restore(options: {
    paths: string[],
    name: string,
    fallbacks: string[],
    wait?: number,
    startedAt?: number
  }): Promise<string | undefined> {
    options.startedAt ??= Date.now()
    // NOTE: restoreCache mutates paths argument, that makes it impossible to reuse
    const paths = [...options.paths]
    const restoredName = await restoreCache(options.paths, options.name, options.fallbacks, {}, true)
    if (restoredName) {
      core.info(`cache was successfully restored with ${options.name}`)
      return restoredName
    } else if (options.wait) {
      if (options.startedAt + options.wait >= Date.now()) {
        throw new Error(`Failed to restore artifact during ${options.wait} ms`)
      }
      core.info(`waiting for cache with name ${options.name} to appear`)
      await setTimeout(20_000)
      return restore({...options, paths})
    }
  }
}
