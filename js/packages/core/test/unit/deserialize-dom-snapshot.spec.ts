import assert from 'assert'
import {type DeserializedDomSnapshot, deserializeDomSnapshot} from '../../src/ufg/utils/deserialize-dom-snapshot'
import {DomSnapshot} from '@applitools/ufg-client'

describe('deserializeDomSnapshot', async () => {
  it('works', () => {
    const snapshot: DomSnapshot = {
      cdt: [],
      url: 'url',
      resourceUrls: [],
      resourceContents: {
        'blob-1': {type: 'type-1', value: Buffer.from('abc').toString('base64')},
      },
      frames: [
        {
          cdt: [],
          url: 'frame-1-url',
          resourceUrls: [],
          resourceContents: {
            'blob-2': {type: 'type-2', value: Buffer.from('def').toString('base64')},
          },
          frames: [
            {
              cdt: [],
              url: 'frame-1-url',
              resourceUrls: [],
              resourceContents: {
                'blob-3': {type: 'type-3', value: Buffer.from('ghi').toString('base64')},
              },
              frames: [],
            },
          ],
        },
      ],
    }

    const expected: DeserializedDomSnapshot = {
      cdt: [],
      url: 'url',
      resourceUrls: [],
      resourceContents: {
        'blob-1': {type: 'type-1', value: Buffer.from('abc')},
      },
      frames: [
        {
          cdt: [],
          url: 'frame-1-url',
          resourceUrls: [],
          resourceContents: {
            'blob-2': {type: 'type-2', value: Buffer.from('def')},
          },
          frames: [
            {
              cdt: [],
              url: 'frame-1-url',
              resourceUrls: [],
              resourceContents: {
                'blob-3': {type: 'type-3', value: Buffer.from('ghi')},
              },
              frames: [],
            },
          ],
        },
      ],
    }

    assert.deepStrictEqual(deserializeDomSnapshot(snapshot), expected)
  })
})
