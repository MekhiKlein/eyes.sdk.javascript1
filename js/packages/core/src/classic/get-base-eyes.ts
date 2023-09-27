import type {Eyes, GetBaseEyesSettings, OpenSettings} from './types'
import type {Eyes as BaseEyes} from '@applitools/core-base'
import {type SpecType} from '@applitools/driver'
import {type Logger} from '@applitools/logger'
import {toEnvironmentKey} from '../automation/utils/to-environment-key'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType> = {
  settings: OpenSettings
  eyes: Eyes<TSpec>
  logger: Logger
}

export function makeGetBaseEyes<TSpec extends SpecType>({
  settings: defaultSettings,
  eyes,
  logger: mainLogger,
}: Options<TSpec>) {
  const getBaseEyesWithCache = utils.general.wrap(getBaseEyes, (getBaseEyes, options) => {
    const key = toEnvironmentKey(options.settings.environment)
    let item = eyes.storage.get(key)
    if (!item) {
      item = {eyes: utils.promises.makeControlledPromise(), jobs: []}
      eyes.storage.set(key, item)
    }
    if (!item.eyes.settled) item.eyes.resolve(getBaseEyes(options))
    return item.eyes
  })

  return getBaseEyesWithCache

  async function getBaseEyes({
    settings,
    logger = mainLogger,
  }: {
    settings: GetBaseEyesSettings
    logger?: Logger
  }): Promise<BaseEyes> {
    logger = logger.extend(mainLogger)

    logger.log(`Command "getBaseEyes" is called with settings`, settings)

    return eyes.core.base.openEyes({
      settings: {
        ...defaultSettings,
        environment: {...defaultSettings.environment, ...settings.environment},
      },
      logger,
    })
  }
}
