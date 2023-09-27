import {makeCore} from '../../../src/ufg/core'
import {makeTestServer} from '@applitools/test-server'
import {getTestInfo} from '@applitools/test-utils'
import assert from 'assert'
import * as spec from '@applitools/spec-driver-puppeteer'

const batch = {id: `${Date.now()}`}

describe('custom properties per environment', () => {
  let driver: spec.Driver, destroyDriver: () => Promise<void>
  let server: any, baseUrl: string

  before(async () => {
    ;[driver, destroyDriver] = await spec.build({browser: 'chrome'})
    server = await makeTestServer()
    baseUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await server?.close()
    await destroyDriver?.()
  })

  it('sets custom properties per environment', async () => {
    await driver.goto(`${baseUrl}/page/index.html`)
    const core = makeCore({spec, concurrency: 10})

    const customProp = {name: 'prop-1', value: 'testing 123'}

    const openSettings = {
      eyesServerUrl: 'https://eyesapi.applitools.com',
      apiKey: process.env.APPLITOOLS_API_KEY!,
      appName: 'core app',
      testName: 'sets custom properties per browser',
      properties: [customProp],
      batch,
    }

    const environments = [
      {
        width: 640,
        height: 480,
        name: 'chrome' as const,
        properties: [
          {name: 'environment', value: 'chrome'},
          {name: 'prop-1', value: 'duplicate so what 1'},
        ],
      },
      {
        width: 800,
        height: 600,
        name: 'firefox' as const,
        properties: [
          {name: 'environment', value: 'firefox'},
          {name: 'prop-1', value: 'duplicate so what 2'},
        ],
      },
      {
        chromeEmulationInfo: {deviceName: 'iPhone X' as const},
        properties: [
          {name: 'environment', value: 'iPhone X'},
          {name: 'prop-1', value: 'duplicate so what 3'},
        ],
      },
    ]
    const bothResults = []
    const checkPromise = core.openEyes({target: driver, settings: openSettings}).then(async eyes => {
      await eyes.check({settings: {environments}})
      await eyes.close({settings: {updateBaselineIfNew: false}})
      return eyes.getResults()
    })

    bothResults.push(await checkPromise)

    const checkAndClosePromise = core.openEyes({target: driver, settings: openSettings}).then(async eyes => {
      await eyes.checkAndClose({settings: {environments, updateBaselineIfNew: false}})
      return eyes.getResults()
    })

    bothResults.push(await checkAndClosePromise)

    for (const results of bothResults) {
      for (const [index, result] of results.entries()) {
        const testData = await getTestInfo(result)
        assert.deepStrictEqual(testData.startInfo.properties, [customProp, ...environments[index].properties!])
      }
    }
  })
})
