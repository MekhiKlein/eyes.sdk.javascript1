import type {Cookie, DomSnapshot} from '@applitools/ufg-client'
import * as utils from '@applitools/utils'

export type DeserializedDomSnapshot = {
  cdt: any[]
  url: string
  resourceUrls: string[]
  resourceContents: Record<
    string,
    | {
        type: string
        value: Buffer
        dependencies?: string[]
      }
    | {
        errorStatusCode: number
      }
  >
  frames: DeserializedDomSnapshot[]
  cookies?: Cookie[]
}

export function deserializeDomSnapshot(snapshot: DomSnapshot): DeserializedDomSnapshot {
  const {resourceContents, ...rest} = snapshot
  return {
    ...rest,
    resourceContents: Object.entries(resourceContents).reduce((resourceContents, [url, resource]) => {
      return {
        ...resourceContents,
        [url]: utils.types.has(resource, 'value')
          ? {...resource, value: Buffer.from(resource.value, 'base64')}
          : resource,
      }
    }, {}),
    frames: snapshot.frames.map(frameSnapshot => deserializeDomSnapshot(frameSnapshot)),
  }
}
