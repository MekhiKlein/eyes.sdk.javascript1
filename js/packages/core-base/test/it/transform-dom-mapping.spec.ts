import {readFileSync} from 'fs'
import {Buffer} from 'buffer'
import {testServer} from '@applitools/test-server'
import {transformDomMapping} from '../../src/utils/transform-dom-mapping'
import assert from 'assert'

describe('transform-dom-mapping', () => {
  const expectedDomMapping = readFileSync('./test/fixtures/dom-mapping.json')

  let destroyServer: () => Promise<void>, baseUrl: string
  before(async () => {
    const server = await testServer()
    destroyServer = () => server.close()
    baseUrl = `http://localhost:${server.port}`
  })
  after(async () => {
    await destroyServer?.()
  })
  it('from filepath', async () => {
    const settings = {domMapping: './test/fixtures/dom-mapping.json' as string | Uint8Array}
    await transformDomMapping(settings)
    assert.ok(Buffer.compare(settings.domMapping as Uint8Array, expectedDomMapping) === 0)
  })
  it('from URL', async () => {
    const settings = {domMapping: (baseUrl + '/dom-mapping.json') as string | Uint8Array}
    await transformDomMapping(settings)
    assert.ok(Buffer.compare(settings.domMapping as Uint8Array, expectedDomMapping) === 0)
  })
  it('from buffer', async () => {
    const settings = {domMapping: readFileSync('./test/fixtures/dom-mapping.json')}
    await transformDomMapping(settings)
    assert.ok(Buffer.compare(settings.domMapping, expectedDomMapping) === 0)
  })
})
