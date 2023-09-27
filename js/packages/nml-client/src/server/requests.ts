import type {
  BrokerServerSettings,
  ScreenshotSettings,
  Screenshot,
  SnapshotSettings,
  IOSSnapshot,
  AndroidSnapshot,
  ActualEnvironment,
} from '../types'
import {type Logger} from '@applitools/logger'
import {makeReqBroker} from './req-broker'
import globalReq from '@applitools/req'
import * as utils from '@applitools/utils'

export interface NMLRequests {
  getSupportedEnvironments(options: {logger?: Logger}): Promise<Record<string, any>>
  takeScreenshots(options: {settings: ScreenshotSettings; logger?: Logger}): Promise<Screenshot[]>
  takeSnapshots<TSnapshot extends IOSSnapshot | AndroidSnapshot = IOSSnapshot | AndroidSnapshot>(options: {
    settings: SnapshotSettings
    logger?: Logger
  }): Promise<TSnapshot[]>
}

export function makeNMLRequests({
  settings,
  logger: mainLogger,
}: {
  settings: BrokerServerSettings
  logger: Logger
}): NMLRequests {
  let brokerUrl = settings.brokerUrl
  const req = makeReqBroker({settings, logger: mainLogger})

  const getSupportedEnvironmentsWithCache = utils.general.cachify(getSupportedEnvironments, () => 'default')

  return {
    getSupportedEnvironments: getSupportedEnvironmentsWithCache,
    takeScreenshots,
    takeSnapshots,
  }

  async function getSupportedEnvironments({logger: _logger}: {logger?: Logger}): Promise<Record<string, any>> {
    const response = await globalReq(settings.supportedEnvironmentsUrl)
    const result: any = await response.json()
    return result
  }

  async function takeScreenshots({
    settings,
    logger = mainLogger,
  }: {
    settings: ScreenshotSettings
    logger?: Logger
  }): Promise<Screenshot[]> {
    logger = logger.extend(mainLogger, {tags: [`nml-request-${utils.general.shortid()}`]})

    logger.log('Request "takeScreenshots" called with settings', settings)

    const supportedEnvironments = await getSupportedEnvironmentsWithCache({logger})
    const {localEnvironment, renderEnvironments, environmentSettings} = settings.environments.reduce(
      (result, environment) => {
        if (!utils.types.has(environment, 'iosDeviceInfo') && !utils.types.has(environment, 'androidDeviceInfo')) {
          result.localEnvironment = {...environment, environmentId: utils.general.guid()}
        } else {
          const deviceInfo = utils.types.has(environment, 'iosDeviceInfo')
            ? environment.iosDeviceInfo
            : environment.androidDeviceInfo
          const orientation =
            deviceInfo.screenOrientation === 'landscape' ? 'landscapeLeft' : deviceInfo.screenOrientation ?? 'portrait'
          const rawEnvironment = supportedEnvironments[deviceInfo.deviceName][orientation].env
          result.renderEnvironments.push({
            requested: environment,
            environmentId: utils.general.guid(),
            deviceName: rawEnvironment.deviceInfo,
            os: rawEnvironment.os + (deviceInfo.version ? ` ${deviceInfo.version}` : ''),
            viewportSize: rawEnvironment.displaySize,
          })
          result.environmentSettings.push({...supportedEnvironments[deviceInfo.deviceName], orientation})
        }
        return result
      },
      {
        localEnvironment: undefined as ActualEnvironment | undefined,
        renderEnvironments: [] as ActualEnvironment[],
        environmentSettings: [] as any[],
      },
    )

    try {
      const response = await req(brokerUrl, {
        name: 'TAKE_SCREENSHOT',
        body: {
          protocolVersion: '1.0',
          name: 'TAKE_SCREENSHOT',
          key: utils.general.guid(),
          payload: {
            ...settings,
            environments: undefined,
            deviceList: !localEnvironment ? environmentSettings : undefined,
          },
        },
        logger,
      })
      const result: any = await response.json()
      brokerUrl = result.nextPath
      const screenshots = localEnvironment
        ? [{image: result.payload.result.screenshotUrl, environment: localEnvironment}]
        : renderEnvironments.map((environment, index) => {
            return {image: result.payload[index].result.screenshotUrl, environment}
          })

      logger.log('Request "takeScreenshots" finished successfully with body', screenshots)

      return screenshots
    } catch (error: any) {
      if (error.nextPath) brokerUrl = error.nextPath
      throw error
    }
  }

  async function takeSnapshots<TSnapshot extends IOSSnapshot | AndroidSnapshot = IOSSnapshot | AndroidSnapshot>({
    settings,
    logger = mainLogger,
  }: {
    settings: SnapshotSettings
    logger?: Logger
  }): Promise<TSnapshot[]> {
    try {
      const response = await req(brokerUrl, {
        name: 'TAKE_SNAPSHOT',
        body: {
          protocolVersion: '1.0',
          name: 'TAKE_SNAPSHOT',
          key: utils.general.guid(),
          payload: {
            waitBeforeCapture: settings.waitBeforeCapture,
          },
        },
        logger,
      })
      const result: any = await response.json()
      brokerUrl = result.nextPath
      const platformName = result.payload.result.resourceMap.metadata.platformName
      const snapshot = {platformName, vhsHash: result.payload.result.resourceMap.vhs} as TSnapshot
      if (platformName === 'ios') {
        ;(snapshot as IOSSnapshot).vhsCompatibilityParams = {
          UIKitLinkTimeVersionNumber: result.payload.result.metadata.UIKitLinkTimeVersionNumber,
          UIKitRunTimeVersionNumber: result.payload.result.metadata.UIKitRunTimeVersionNumber,
        }
      } else if (platformName === 'android') {
        ;(snapshot as AndroidSnapshot).vhsType = 'android-x'
      }
      return Array(settings.environments.length).fill(snapshot)
    } catch (error: any) {
      if (error.nextPath) brokerUrl = error.nextPath
      throw error
    }
  }
}
