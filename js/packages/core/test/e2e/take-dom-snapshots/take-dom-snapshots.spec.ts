import {makeDriver, type Driver, type SpecType} from '@applitools/driver'
import {makeLogger} from '@applitools/logger'
import * as spec from '@applitools/spec-driver-puppeteer'
import assert from 'assert'
import {takeDomSnapshots} from '../../../src/ufg/utils/take-dom-snapshots'

describe('lazy load', () => {
  let page: spec.Driver, destroyPage: () => Promise<void>, driver: Driver<SpecType>

  before(async () => {
    ;[page, destroyPage] = await spec.build({browser: 'chrome'})
    driver = await makeDriver({driver: page, spec})
  })

  after(async () => {
    await destroyPage?.()
  })

  it('performs lazy load before taking snapshot', async () => {
    const logger = makeLogger()
    await page.goto('https://applitools.github.io/demo/TestPages/LazyLoad/')

    const [
      {
        snapshot: {cdt, resourceUrls},
      },
    ] = await takeDomSnapshots({
      driver,
      settings: {
        lazyLoad: true,
        renderers: [{width: 1, height: 1, name: 'chrome'}],
        disableBrowserFetching: true,
      },
      logger,
    })

    // verify that all images have src attribute
    assert.deepStrictEqual(
      cdt.filter(node => node.nodeName === 'IMG').every(node => node.attributes.find(attr => attr.name === 'src')),
      true,
    )

    assert.deepStrictEqual(resourceUrls, [
      'https://applitools.github.io/demo/TestPages/LazyLoad/Barack_Obama.jpeg',
      'https://applitools.github.io/demo/TestPages/LazyLoad/George_W_Bush.jpeg',
      'https://applitools.github.io/demo/TestPages/LazyLoad/Bill_Clinton.jpeg',
      'https://applitools.github.io/demo/TestPages/LazyLoad/George_H_W_Bush.jpeg',
      'https://applitools.github.io/demo/TestPages/LazyLoad/Ronald_Reagan.jpeg',
    ])
  })
})
