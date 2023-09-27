import type {Mutable} from '@applitools/utils'
import type {DriverTarget, Eyes, CloseSettings, Environment} from '../ufg/types'
import {type Logger} from '@applitools/logger'
import {isDriver, makeDriver, type SpecType, type SpecDriver} from '@applitools/driver'
import {uniquifyEnvironments} from './utils/uniquify-environments'

type Options<TSpec extends SpecType> = {
  eyes: Eyes<TSpec>
  target?: DriverTarget<TSpec>
  environments?: Environment[]
  spec?: SpecDriver<TSpec>
  logger: Logger
}

export function makeClose<TSpec extends SpecType>({
  eyes,
  target,
  environments: defaultEnvironments,
  spec,
  logger: mainLogger,
}: Options<TSpec>) {
  return async function close({
    settings,
    logger = mainLogger,
  }: {
    settings?: CloseSettings
    logger?: Logger
  } = {}): Promise<void> {
    logger = logger.extend(mainLogger)

    logger.log('Command "close" is called with settings', settings)

    if (!eyes.running) {
      logger.log('Command "close" will be ignored because eyes were already stopped')
      return
    } else {
      ;(eyes as Mutable<typeof eyes>).running = false
    }

    settings ??= {}
    if (!settings.testMetadata && isDriver(target, spec)) {
      try {
        const driver = await makeDriver({spec, driver: target, relaxed: true, logger})
        settings.testMetadata = await driver.getSessionMetadata()
      } catch (error: any) {
        logger.warn('Command "close" received an error during extracting driver metadata', error)
      }
    }

    settings.environments ??= defaultEnvironments
    if (eyes.storage.size === 0 && settings.environments && settings.environments.length > 0) {
      const uniqueEnvironments = uniquifyEnvironments(settings.environments)
      logger.log('Command "close" starting filler tests for environments', settings.environments)
      await Promise.all(uniqueEnvironments.map(environment => eyes.getBaseEyes({settings: {environment}, logger})))
    }

    eyes.storage.forEach(async item => {
      try {
        const [eyes] = await Promise.all([item.eyes, ...item.jobs])
        try {
          await eyes.close({settings, logger})
        } catch (error) {
          logger.warn('Command "close" received an error during performing, trying to perform abort instead', error)
          await eyes.abort({settings, logger})
        }
      } catch (error: any) {
        logger.warn('Command "close" received an error during waiting for eyes instances in background', error)
        await error.info?.eyes?.abort({settings, logger})
      }
    })
  }
}
