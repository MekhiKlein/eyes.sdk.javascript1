import type {Target, DriverTarget, Eyes, CheckSettings, Environment, ExactEnvironment} from './types'
import type {Target as BaseTarget, CheckSettings as BaseCheckSettings} from '@applitools/core-base'
import {type AbortSignal} from 'abort-controller'
import {type Environment as NMLEnvironment} from '@applitools/nml-client'
import {type Logger} from '@applitools/logger'
import {makeDriver, isDriver, type SpecType, type SpecDriver} from '@applitools/driver'
import {takeScreenshots} from './utils/take-screenshots'
import {toBaseCheckSettings} from '../automation/utils/to-base-check-settings'
import {waitForLazyLoad} from '../automation/utils/wait-for-lazy-load'
import {uniquifyEnvironments} from '../automation/utils/uniquify-environments'
import {toEnvironmentKey} from '../automation/utils/to-environment-key'
import {AbortError} from '../errors/abort-error'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType> = {
  eyes: Eyes<TSpec>
  target?: DriverTarget<TSpec>
  environments?: Environment[]
  spec?: SpecDriver<TSpec>
  signal?: AbortSignal
  logger: Logger
}

export function makeCheck<TSpec extends SpecType>({
  eyes,
  target: defaultTarget,
  environments: defaultEnvironments = [],
  spec,
  signal,
  logger: mainLogger,
}: Options<TSpec>) {
  return async function check({
    target = defaultTarget,
    settings = {},
    logger = mainLogger,
  }: {
    target?: Target<TSpec>
    settings?: CheckSettings<TSpec>
    logger?: Logger
  } = {}): Promise<void> {
    logger = logger.extend(mainLogger)

    logger.log('Command "check" is called with settings', settings)

    if (!target) throw new Error('Method was called with no target')

    if (signal?.aborted) {
      logger.warn('Command "check" was called after test was already aborted')
      throw new AbortError('Command "check" was called after test was already aborted')
    }

    const uniqueEnvironments = uniquifyEnvironments(settings.environments ?? defaultEnvironments)

    const baseTargets = [] as BaseTarget[]
    const baseSettings = [] as BaseCheckSettings[]
    const exactEnvironments = [] as ExactEnvironment[]
    if (isDriver(target, spec)) {
      const driver = await makeDriver({spec, driver: target, reset: target === defaultTarget, logger})
      await driver.currentContext.setScrollingElement(settings.scrollRootElement ?? null)

      const driverEnvironment = await driver.getEnvironment()
      uniqueEnvironments.forEach(environment => {
        if (utils.types.has(environment, 'iosDeviceInfo')) {
          environment.iosDeviceInfo.version ??= driverEnvironment.platformVersion
        } else if (utils.types.has(environment, 'androidDeviceInfo')) {
          environment.androidDeviceInfo.version ??= driverEnvironment.platformVersion
        }
        return environment
      })

      if (settings.lazyLoad && driverEnvironment.isWeb) {
        await waitForLazyLoad({
          context: driver.currentContext,
          settings: settings.lazyLoad !== true ? settings.lazyLoad : {},
          logger,
        })
      }

      const {elementReferencesToCalculate, getBaseCheckSettings} = toBaseCheckSettings({settings})
      if (driverEnvironment.isWeb || !driverEnvironment.isApplitoolsLib || settings.screenshotMode === 'default') {
        const screenshots = await takeScreenshots({
          driver,
          settings: {
            ...settings,
            environments: uniqueEnvironments,
            regionsToCalculate: elementReferencesToCalculate,
            calculateView: !!settings.pageId,
            domSettings: settings.sendDom ? {proxy: eyes.test.eyesServer.proxy} : undefined,
          },
          logger,
        })
        exactEnvironments.push(...uniqueEnvironments)
        screenshots.forEach(({calculatedRegions, ...baseTarget}) => {
          baseTargets.push(baseTarget)
          baseSettings.push(getBaseCheckSettings({calculatedRegions}))
        })
      } else {
        const nmlClient = await eyes.core.getNMLClient({
          driver,
          settings: {...eyes.test.eyesServer, supportedEnvironmentsUrl: eyes.test.supportedEnvironmentsUrl},
          logger,
        })
        const screenshots = await nmlClient.takeScreenshots({
          settings: {
            environments: uniqueEnvironments as NMLEnvironment[],
            fully: settings.fully,
            stitchMode: settings.stitchMode,
            hideScrollbars: settings.hideScrollbars,
            hideCaret: settings.hideScrollbars,
            overlap: settings.overlap,
            waitBeforeCapture: settings.waitBeforeCapture,
            waitBetweenStitches: settings.waitBetweenStitches,
            lazyLoad: settings.lazyLoad,
            name: settings.name,
          },
          logger,
        })
        screenshots.forEach(({environment, ...baseTarget}) => {
          exactEnvironments.push(environment)
          baseTargets.push({...baseTarget, isTransformed: true})
          baseSettings.push(getBaseCheckSettings({calculatedRegions: []}))
        })
      }
    } else {
      exactEnvironments.push(...uniqueEnvironments)
      baseTargets.push(target)
      baseSettings.push(settings as BaseCheckSettings)
    }

    const promises = exactEnvironments.map(async (environment, index) => {
      const environmentLogger = logger.extend({tags: [`environment-${utils.general.shortid()}`]})
      try {
        if (signal?.aborted) {
          environmentLogger.warn('Command "check" was aborted before checking')
          throw new AbortError('Command "check" was aborted before checking')
        }

        const baseEyes = await eyes.getBaseEyes({settings: {environment}, logger: environmentLogger})
        try {
          if (signal?.aborted) {
            environmentLogger.warn('Command "check" was aborted before checking')
            throw new AbortError('Command "check" was aborted before checking')
          } else if (!baseEyes.running) {
            environmentLogger.warn(
              `Check on environment with id "${baseEyes.test.environment?.environmentId}" was aborted during one of the previous steps`,
            )
            throw new AbortError(
              `Check on environment with id "${baseEyes.test.environment?.environmentId}" was aborted during one of the previous steps`,
            )
          }

          await baseEyes.check({
            target: baseTargets[index],
            settings: baseSettings[index],
            logger: environmentLogger,
          })
        } catch (error: any) {
          environmentLogger.error(
            `Check on environment with id "${baseEyes.test.environment?.environmentId}" failed due to an error`,
            error,
          )
          if (baseEyes.running && !signal?.aborted) await baseEyes.abort({logger: environmentLogger})
          error.info = {eyes: baseEyes}
          throw error
        }
      } catch (error: any) {
        environmentLogger.error(
          `Environment with id ${environment.environmentId} failed before checking started due to an error`,
          error,
        )
        error.info = {...error.info, userTestId: eyes.test.userTestId, environment}
        throw error
      }
    })

    exactEnvironments.forEach((environment, index) => {
      const key = toEnvironmentKey(environment)
      let item = eyes.storage.get(key)
      if (!item) {
        item = {eyes: utils.promises.makeControlledPromise(), jobs: []}
        eyes.storage.set(key, item)
      }
      item.jobs.push(promises[index])
    })
  }
}
