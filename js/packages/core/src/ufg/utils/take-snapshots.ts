import type {Size} from '@applitools/utils'
import {type Logger} from '@applitools/logger'
import {type Driver} from '@applitools/driver'
import {
  type DomSnapshot,
  type AndroidSnapshot,
  type IOSSnapshot,
  type ChromeEmulationDevice,
  type IOSDevice,
  type ScreenOrientation,
} from '@applitools/ufg-client'
import {takeDomSnapshots, type DomSnapshotsSettings} from './take-dom-snapshots'
import {takeVHSes, type VHSesSettings} from './take-vhses'
import {takeSnapshots as takeSnapshotsWithNml} from '@applitools/nml-client'
import {extractBrokerUrl} from './extract-broker-url'

export * from './take-dom-snapshots'
export * from './take-vhses'

export async function takeSnapshots<TDriver extends Driver<unknown, unknown, unknown, unknown>>({
  driver,
  settings,
  hooks,
  provides,
  logger,
}: {
  driver: TDriver
  settings: DomSnapshotsSettings & VHSesSettings
  hooks: {beforeSnapshots?(): void | Promise<void>; beforeEachSnapshot?(): void | Promise<void>}
  provides: {
    getChromeEmulationDevices(): Promise<Record<ChromeEmulationDevice, Record<ScreenOrientation, Size>>>
    getIOSDevices(): Promise<Record<IOSDevice, Record<ScreenOrientation, Size>>>
  }
  logger: Logger
}): Promise<DomSnapshot[] | AndroidSnapshot[] | IOSSnapshot[]> {
  if (driver.isWeb) {
    return takeDomSnapshots({driver, settings, hooks, provides, logger})
  } else {
    const brokerUrl = await extractBrokerUrl({driver, logger})
    if (brokerUrl) {
      return (await takeSnapshotsWithNml({url: brokerUrl, settings, logger})) as AndroidSnapshot[] | IOSSnapshot[]
    } else {
      return takeVHSes({driver, settings, hooks, logger})
    }
  }
}
