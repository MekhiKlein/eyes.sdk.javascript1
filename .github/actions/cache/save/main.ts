import {type Cache} from './types.js'
import {saveCache} from "@actions/cache";
import * as core from "@actions/core";

const cache = JSON.parse(core.getInput('cache', {required: true})) as Cache | Cache[]

main(cache)

async function main(cache: Cache | Cache[]): Promise<number[]> {
  cache = Array.isArray(cache) ? cache : [cache]

  return await Promise.all(cache.map(async (cache) => {
    return saveCache(cache.path, cache.key, {}, true)
  }))
}
