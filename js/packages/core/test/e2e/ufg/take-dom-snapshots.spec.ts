import {makeLogger} from '@applitools/logger'
import {makeTestServer} from '@applitools/test-server'
import * as spec from '@applitools/spec-driver-puppeteer'
import {takeDomSnapshots} from '../../../src'
import {makeDriver} from '@applitools/driver'
import assert from 'assert'

describe('e2e take-dom-snapshots', () => {
  let page: spec.Driver, destroyPage: () => Promise<void>, server: any, baseUrl: string, logger: any

  before(async () => {
    ;[page, destroyPage] = await spec.build({browser: 'chrome', headless: 'new'})
    server = await makeTestServer()
    baseUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await destroyPage?.()
    await server?.close()
  })

  beforeEach(() => {
    logger = makeLogger()
  })

  it('run lazyLoad as a settings parameter', async () => {
    await page.goto(`${baseUrl}/lazy-load/index.html`)
    const driver = await makeDriver({spec, driver: page, logger})
    assert.deepStrictEqual(
      await driver.execute(function () {
        return document.querySelectorAll('.lazy').length
      }),
      1,
      'should be 1 lazy load images',
    )
    const snapshots = await takeDomSnapshots({
      driver,
      settings: {
        lazyLoad: true,
        renderers: [{width: 100, height: 100, name: 'chrome'}],
      },
      logger,
    })
    assert.deepStrictEqual(
      !!snapshots?.[0].snapshot.resourceContents[
        'https://applitools.github.io/demo/TestPages/LazyLoad/George_W_Bush.jpeg'
      ],
      true,
      'should have the image in the resource contents',
    )
  })
})
