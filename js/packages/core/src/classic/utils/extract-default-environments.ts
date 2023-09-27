import type {ExactEnvironment, Environment} from '../types'
import {type SpecType, type Driver} from '@applitools/driver'
import * as utils from '@applitools/utils'

export async function extractDefaultEnvironments<TSpec extends SpecType>({
  driver,
  settings,
}: {
  driver?: Driver<TSpec>
  settings?: {keepPlatformNameAsIs?: boolean; environment?: ExactEnvironment}
}): Promise<Environment[]> {
  const environment = {} as ExactEnvironment

  if (!driver) return [settings?.environment ?? environment]

  const currentContext = driver.currentContext
  try {
    const driverEnvironment = await driver.getEnvironment()
    const viewport = await driver.getViewport()
    const size = await driver.getViewportSize()
    environment.viewportSize = utils.geometry.scale(size, viewport.viewportScale)
    if (driverEnvironment.isEC) environment.ecSessionId = (await driver.getSessionId()) ?? undefined
    if (driverEnvironment.isWeb) environment.userAgent = await driver.getUserAgentLegacy()
    if (driverEnvironment.deviceName) environment.deviceName = driverEnvironment.deviceName
    if (driverEnvironment.isNative && driverEnvironment.platformName) {
      environment.os = driverEnvironment.platformName
      if (driverEnvironment.platformVersion) environment.os += ` ${driverEnvironment.platformVersion}`
      if (!settings?.keepPlatformNameAsIs) {
        if (/^android/i.test(environment.os)) {
          environment.os = `Android${environment.os.slice(7)}`
        }
        if (/^ios/i.test(environment.os)) {
          environment.os = `iOS${environment.os.slice(3)}`
        }
      }
    } else if (
      driverEnvironment.isReliable &&
      driverEnvironment.isChromium &&
      ((driverEnvironment.isWindows && Number.parseInt(driverEnvironment.browserVersion!) >= 107) ||
        (driverEnvironment.isMac && Number.parseInt(driverEnvironment.browserVersion!) >= 90))
    ) {
      environment.os = `${driverEnvironment.platformName} ${driverEnvironment.platformVersion ?? ''}`.trim()
    }

    return [environment]
  } finally {
    await currentContext.focus()
  }
}
