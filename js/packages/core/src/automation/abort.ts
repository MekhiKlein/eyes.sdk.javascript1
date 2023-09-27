import type {Mutable} from '@applitools/utils'
import type {DriverTarget, Eyes, AbortSettings, Environment} from './types'
import {type Logger} from '@applitools/logger'
import {type AbortController} from 'abort-controller'
import {isDriver, makeDriver, type SpecType, type SpecDriver} from '@applitools/driver'
import {uniquifyEnvironments} from './utils/uniquify-environments'

type Options<TSpec extends SpecType> = {
  eyes: Eyes<TSpec>
  target?: DriverTarget<TSpec>
  controller: AbortController
  environments?: Environment[]
  spec?: SpecDriver<TSpec>
  logger: Logger
}

export function makeAbort<TSpec extends SpecType>({
  eyes,
  target,
  controller,
  environments: defaultEnvironments,
  spec,
  logger: mainLogger,
}: Options<TSpec>) {
  return async function abort({
    settings,
    logger = mainLogger,
  }: {
    settings?: AbortSettings
    logger?: Logger
  } = {}): Promise<void> {
    logger = logger.extend(mainLogger)

    logger.log('Command "abort" is called with settings', settings)

    if (!eyes.running) {
      logger.log('Command "abort" will be ignored because eyes were already stopped')
      return
    } else {
      ;(eyes as Mutable<typeof eyes>).running = false
    }

    controller.abort()
    settings ??= {}
    if (!settings.testMetadata && isDriver(target, spec)) {
      try {
        const driver = await makeDriver({spec, driver: target, relaxed: true, logger})
        settings.testMetadata = await driver.getSessionMetadata()
      } catch (error: any) {
        logger.warn('Command "abort" received an error during extracting driver metadata', error)
      }
    }

    settings.environments ??= defaultEnvironments
    if (eyes.storage.size === 0 && settings.environments && settings.environments.length > 0) {
      const uniqueEnvironments = uniquifyEnvironments(settings.environments)
      logger.log('Command "abort" starting filler tests for environments', uniqueEnvironments)
      await Promise.all(uniqueEnvironments.map(environment => eyes.getBaseEyes({settings: {environment}, logger})))
    }

    eyes.storage.forEach(async item => {
      try {
        const eyes = await item.eyes
        await eyes.abort({settings, logger})
      } catch (error: any) {
        logger.warn('Command "abort" received an error during waiting for eyes instances in background', error)
        await error?.info?.eyes?.abort({settings, logger})
      }
    })
  }
}
