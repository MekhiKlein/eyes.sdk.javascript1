import {type LookupFunction} from 'net'
import {promises as dns, type LookupOptions, type LookupAddress} from 'dns'
import * as utils from '@applitools/utils'

const dnsCache: Record<string, LookupAddress | LookupAddress[]> = {}

export async function lookup(
  hostname: string,
  options: LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  try {
    if (!dnsCache[hostname]) {
      dnsCache[hostname] = await dns.lookup(hostname, options)
      // Note: leaving the console logs commented out here on purpose since currently this is the only way to test it
      // console.log('dns cache MISS', hostname, dnsCache[hostname])
      // } else {
      //   console.log('dns cache HIT', hostname, dnsCache[hostname])
    }
    const result = dnsCache[hostname]
    const addresses = utils.types.isArray(result) ? result : [result]
    if (options.all) callback(null, addresses)
    else callback(null, addresses[0].address, addresses[0].family)
  } catch (error) {
    callback(error as NodeJS.ErrnoException, '', 0)
  }
}

export const lookupWithCache = lookup as LookupFunction
