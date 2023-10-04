import type {AndroidSnapshot} from '../../src/types'
import {makeNMLClient} from '../../src/client'
import {makeProxyServer} from '@applitools/test-server'
import * as spec from '@applitools/spec-driver-webdriver'
import assert from 'assert'

async function extractBrokerUrl(driver: spec.Driver): Promise<string> {
  const element = await driver.findElement('accessibility id', 'Applitools_View')
  const payload = await driver.getElementText(element['element-6066-11e4-a52e-4f735466cecf'])
  const result = JSON.parse(payload)
  return result.nextPath
}

describe('android snapshot', () => {
  let driver: spec.Driver, destroyDriver: () => Promise<void>
  let proxyServer: any
  const supportedEnvironmentsUrl = 'https://applitoolsnmlresources.z19.web.core.windows.net/devices-list.json'

  beforeEach(async () => {
    ;[driver, destroyDriver] = await spec.build({
      //url: 'http://0.0.0.0:4723/wd/hub',
      device: 'Pixel 4 XL',
      app: 'https://applitools.jfrog.io/artifactory/Examples/simpleapp-appAndroidX-debug.apk.zip',
      capabilities: {
        'appium:appPackage': 'com.applitools.simpleapp',
        'appium:appActivity': 'com.applitools.simpleapp.MainActivity',
        'appium:newCommandTimeout': 300,
        'appium:idleTimeout': 300,
      },
      injectUFGLib: true,
    })
    proxyServer = await makeProxyServer()
  })

  afterEach(async () => {
    await destroyDriver?.()
    await proxyServer?.close()
  })

  it('works', async () => {
    const brokerUrl = await extractBrokerUrl(driver)
    const {takeSnapshots} = makeNMLClient({settings: {brokerUrl, supportedEnvironmentsUrl}})
    const snapshots = await takeSnapshots<AndroidSnapshot>({
      settings: {environments: [{androidDeviceInfo: {deviceName: 'Pixel 3'}}]},
    })
    assert.strictEqual(snapshots.length, 1)
    assert.strictEqual(snapshots[0].platformName, 'android')
    assert.strictEqual(snapshots[0].vhsHash.hashFormat, 'sha256')
    assert.strictEqual(snapshots[0].vhsHash.contentType, 'x-applitools-vhs/android')
  })

  it('works with a proxy server', async () => {
    const brokerUrl = await extractBrokerUrl(driver)
    const {takeSnapshots} = makeNMLClient({
      settings: {brokerUrl, supportedEnvironmentsUrl, proxy: {url: `http://localhost:${proxyServer.port}`}},
    })
    const snapshots = await takeSnapshots<AndroidSnapshot>({
      settings: {
        environments: [{androidDeviceInfo: {deviceName: 'Pixel 3'}}],
      },
    })
    assert.strictEqual(snapshots.length, 1)
    assert.strictEqual(snapshots[0].platformName, 'android')
    assert.strictEqual(snapshots[0].vhsHash.hashFormat, 'sha256')
    assert.strictEqual(snapshots[0].vhsHash.contentType, 'x-applitools-vhs/android')
  })
})
