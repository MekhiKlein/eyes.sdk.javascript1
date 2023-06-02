import {type Cache} from './types.js'
import {existsSync} from 'node:fs'
import {execSync} from 'node:child_process'
import {restoreCache} from '@actions/cache'
import * as core from '@actions/core'

const cache = JSON.parse(core.getInput('cache', {required: true})) as Cache | Cache[]

main(cache)
.then(console.log)
.catch(err => {
  console.error(err)
  core.setFailed(`restore cache failed: ${err.message}`)
})

async function main(cache: Cache | Cache[]): Promise<(string | undefined)[]> {
  if (process.platform === 'linux' && existsSync('/etc/alpine-release')) {
    execSync('apk add --no-cache tar')
  }

  cache = Array.isArray(cache) ? cache : [cache]

  return await Promise.all(cache.map(async (cache) => {
    return restoreCache(cache.path, cache.key, [], {}, true)
  }))
}
