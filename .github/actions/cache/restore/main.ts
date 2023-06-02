import {type Cache} from './types.js'
import {existsSync} from 'node:fs'
import {execSync} from 'node:child_process'
import {restoreCache} from '@actions/cache'
import * as core from '@actions/core'

const cache = JSON.parse(core.getInput('cache', {required: true})) as Cache | Cache[]

main(cache)
  .then(results => {
    core.debug(`successfully restored caches ${results}`)
  })
  .catch(err => {
    core.debug(err)
    core.setFailed(err.message)
  })

async function main(cache: Cache | Cache[]): Promise<(string | undefined)[]> {
  if (process.platform === 'linux' && existsSync('/etc/alpine-release')) {
    core.debug('alpine system is detected, installing necessary dependencies')
    execSync('apk add --no-cache zstd tar')
  }

  cache = Array.isArray(cache) ? cache : [cache]

  return Promise.all(cache.map(async (cache) => {
    return restoreCache(cache.path, cache.key, [], {}, true)
  }))
}
