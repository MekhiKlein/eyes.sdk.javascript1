import type {Core} from '../../src/types'
import {type SpecType} from '@applitools/driver'
import {makeCore} from '../../src/core'
import {generateScreenshot} from '../utils/generate-screenshot'
import {MockDriver, spec} from '@applitools/driver/fake'
import {makeFakeCore} from '../utils/fake-base-core'
import {makeFakeClient} from '../utils/fake-ufg-client'
import assert from 'assert'

describe('abort', async () => {
  let driver: MockDriver, core: Core<SpecType<MockDriver>, 'classic' | 'ufg'>

  async function destroyDriver(driver: MockDriver) {
    driver.wrapMethod('executeScript', async () => {
      throw new Error('The driver is destroyed')
    })
  }

  beforeEach(async () => {
    driver = new MockDriver()
    driver.takeScreenshot = generateScreenshot
    driver.mockElements([
      {selector: 'element0', rect: {x: 1, y: 2, width: 500, height: 501}},
      {selector: 'element1', rect: {x: 10, y: 11, width: 101, height: 102}},
      {selector: 'element2', rect: {x: 20, y: 21, width: 201, height: 202}},
      {selector: 'element3', rect: {x: 30, y: 31, width: 301, height: 302}},
      {selector: 'element4', rect: {x: 40, y: 41, width: 401, height: 402}},
    ])

    const fakeCore = makeFakeCore()
    const fakeClient = makeFakeClient()
    core = makeCore({spec, base: fakeCore, clients: {ufg: fakeClient}})
  })

  it('should not throw if driver is destroyed before abort', async () => {
    const eyes = await core.openEyes({target: driver, settings: {appName: 'App', testName: 'Test'}})
    await eyes.check()
    await destroyDriver(driver)
    await eyes.abort()
  })

  it('should return results of classic eyes if no check was called', async () => {
    const eyes = await core.openEyes({type: 'classic', target: driver, settings: {appName: 'App', testName: 'Test'}})
    await eyes.abort()
    const results = await eyes.getResults()

    assert.strictEqual(results.length, 1)
  })

  it('should return results of classic eyes for renderers if no check was called', async () => {
    const eyes = await core.openEyes({type: 'classic', target: driver, settings: {appName: 'App', testName: 'Test'}})
    await eyes.abort({
      settings: {
        renderers: [
          {environment: {viewportSize: {width: 100, height: 100}}},
          {environment: {viewportSize: {width: 200, height: 200}}},
        ],
      },
    })
    const results = await eyes.getResults()

    assert.strictEqual(results.length, 2)
  })

  it('should return results of classic eyes for renderers from open config if no check was called', async () => {
    const eyes = await core.openEyes({
      type: 'classic',
      target: driver,
      settings: {appName: 'App', testName: 'Test'},
      config: {
        open: {},
        screenshot: {},
        check: {
          renderers: [
            {environment: {viewportSize: {width: 100, height: 100}}},
            {environment: {viewportSize: {width: 200, height: 200}}},
          ],
        },
        close: {},
      },
    })
    await eyes.abort()
    const results = await eyes.getResults()

    assert.strictEqual(results.length, 2)
  })

  it('should not return results of ufg eyes if no check was called', async () => {
    const eyes = await core.openEyes({type: 'ufg', target: driver, settings: {appName: 'App', testName: 'Test'}})
    await eyes.abort()
    const results = await eyes.getResults()

    assert.strictEqual(results.length, 0)
  })

  it('should return results of ufg eyes for renderers if no check was called', async () => {
    const eyes = await core.openEyes({type: 'ufg', target: driver, settings: {appName: 'App', testName: 'Test'}})
    await eyes.abort({
      settings: {
        renderers: [
          {name: 'chrome', width: 100, height: 100},
          {name: 'chrome', width: 200, height: 200},
        ],
      },
    })
    const results = await eyes.getResults()

    assert.strictEqual(results.length, 2)
  })

  it('should not return results of ufg eyes for renderers from open config if no check was called', async () => {
    const eyes = await core.openEyes({
      type: 'ufg',
      target: driver,
      settings: {appName: 'App', testName: 'Test'},
      config: {
        open: {},
        screenshot: {},
        check: {
          renderers: [
            {name: 'chrome', width: 100, height: 100},
            {name: 'chrome', width: 200, height: 200},
          ],
        },
        close: {},
      },
    })
    await eyes.abort()
    const results = await eyes.getResults()

    assert.strictEqual(results.length, 0)
  })
})
