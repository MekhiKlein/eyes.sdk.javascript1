import {type Logger} from '@applitools/logger'
import {type Context, type Cookie} from '@applitools/driver'
import {type DomSnapshot} from '@applitools/ufg-client'
import * as utils from '@applitools/utils'

const {
  getProcessPagePoll,
  getPollResult,
  getProcessPagePollForIE,
  getPollResultForIE,
} = require('@applitools/dom-snapshot')

type RawDomSnapshot = {
  url: string
  selector: string
  cdt: {attributes: {name: string; value: string}[]}[]
  crossFrames: {selector: string; index: number}[]
  frames: RawDomSnapshot[]
  resourceUrls: string[]
  blobs: {url: string; value: string}[]
}

export type DomSnapshotSettings = {
  disableBrowserFetching?: boolean
  skipResources?: string[]
  chunkByteLength?: number
  executionTimeout?: number
  pollTimeout?: number
  showLogs?: boolean
}

export async function takeDomSnapshot<TContext extends Context<unknown, unknown, unknown, unknown>>({
  context,
  settings,
  logger,
}: {
  context: TContext
  settings?: DomSnapshotSettings
  logger: Logger
}): Promise<DomSnapshot> {
  const driver = context.driver
  const cookies: Cookie[] = driver.features?.allCookies ? await driver.getCookies().catch(() => []) : []

  const snapshot = deserializeDomSnapshot({snapshot: await takeContextDomSnapshot({context})})
  snapshot.cookies = cookies
  return snapshot

  async function takeContextDomSnapshot({context}: {context: TContext}): Promise<RawDomSnapshot> {
    // logger.log(`taking dom snapshot. ${context._reference ? `context referece: ${JSON.stringify(context._reference)}` : ''}`)

    if (!driver.features?.allCookies) {
      cookies.push(...(await context.getCookies()))
    }

    const isLegacyBrowser = driver.isIE || driver.isEdgeLegacy

    const arg = {
      dontFetchResources: settings?.disableBrowserFetching,
      skipResources: settings?.skipResources,
      removeReverseProxyURLPrefixes: Boolean(process.env.APPLITOOLS_SCRIPT_REMOVE_REVERSE_PROXY_URL_PREFIXES),
      chunkByteLength:
        settings?.chunkByteLength ??
        (Number(process.env.APPLITOOLS_SCRIPT_RESULT_MAX_BYTE_LENGTH) || (driver.isIOS ? 100_000 : 250 * 1024 * 1024)),
      serializeResources: true,
      compressResources: false,
      showLogs: settings?.showLogs,
    }
    const scripts = {
      main: driver.features?.canExecuteOnlyFunctionScripts
        ? require('@applitools/dom-snapshot').processPagePoll
        : `return (${
            isLegacyBrowser ? await getProcessPagePollForIE() : await getProcessPagePoll()
          }).apply(null, arguments);`,

      poll: driver.features?.canExecuteOnlyFunctionScripts
        ? require('@applitools/dom-snapshot').pollResult
        : `return (${isLegacyBrowser ? await getPollResultForIE() : await getPollResult()}).apply(null, arguments);`,
    }

    const snapshot: RawDomSnapshot = await context.executePoll(scripts, {
      main: arg,
      poll: arg,
      executionTimeout: settings?.executionTimeout ?? 5 * 60 * 1000,
      pollTimeout: settings?.pollTimeout ?? 200,
    })

    const crossFrames = extractCrossFrames({snapshot, logger})
    for (const {reference, parentSnapshot, cdtNode} of crossFrames) {
      const frameContext = await context
        .context(reference)
        .then(context => context.focus())
        .catch(err => {
          const srcAttr = cdtNode.attributes.find(attr => attr.name === 'src')
          if (srcAttr) srcAttr.value = ''
          logger.log(
            `could not switch to frame during takeDomSnapshot. Path to frame: ${JSON.stringify(reference)}`,
            err,
          )
        })

      if (frameContext) {
        const frameSnapshot = await takeContextDomSnapshot({context: frameContext as TContext})
        let url = new URL(frameSnapshot.url)
        if (url.protocol === 'data:') url = new URL(`http://data-url-frame${url.search}`)
        if (!url.searchParams.has('applitools-iframe')) url.searchParams.set('applitools-iframe', utils.general.guid())
        frameSnapshot.url = url.href
        parentSnapshot.frames.push(frameSnapshot)
        cdtNode.attributes.push({name: 'data-applitools-src', value: frameSnapshot.url})
      }
    }

    logger.log(`dom snapshot cdt length: ${snapshot.cdt.length}`)
    logger.log(`blobs urls (${snapshot.blobs.length}):`, JSON.stringify(snapshot.blobs.map(({url}) => url)))
    logger.log(`resource urls (${snapshot.resourceUrls.length}):`, JSON.stringify(snapshot.resourceUrls))
    return snapshot
  }
}

export function deserializeDomSnapshot({snapshot}: {snapshot: RawDomSnapshot}): DomSnapshot {
  const {blobs, selector: _, crossFrames: __, ...rest} = snapshot
  const deserializedSnapshot = {
    ...rest,
    resourceContents: blobs.reduce((resourceContents, blob) => {
      if (blob.value === undefined) return {...resourceContents, [blob.url]: blob}
      else return {...resourceContents, [blob.url]: {...blob, value: Buffer.from(blob.value, 'base64')}}
    }, {}),
    frames: snapshot.frames.map(frameSnapshot => deserializeDomSnapshot({snapshot: frameSnapshot})),
  } as DomSnapshot
  return deserializedSnapshot
}

export function extractCrossFrames({
  snapshot,
  parent = null,
  logger,
}: {
  snapshot: RawDomSnapshot
  parent?: any
  logger: Logger
}): {cdtNode: RawDomSnapshot['cdt'][number]; reference: any; parentSnapshot: RawDomSnapshot}[] {
  const crossFrames = [snapshot, ...(snapshot.frames ?? [])].flatMap((snapshot, index) => {
    const crossFrames = (snapshot.crossFrames ?? []).map(({selector, index}) => ({
      reference: {reference: {type: 'css', selector}, parent},
      parentSnapshot: snapshot,
      cdtNode: snapshot.cdt[index],
    }))
    return [
      ...crossFrames,
      ...(index > 0
        ? extractCrossFrames({
            snapshot,
            parent: {reference: {type: 'css', selector: snapshot.selector}, parent},
            logger,
          })
        : []),
    ]
  })

  logger.log(
    `frames paths for ${snapshot.crossFrames}`,
    crossFrames.map(selector => JSON.stringify(selector)).join(' , '),
  )

  return crossFrames
}
