import type {Eyes, AbortSettings, Environment} from './types'
import {type SpecType} from '@applitools/driver'
import {type Logger} from '@applitools/logger'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TSpec, TType>
  environments?: Environment[]
  logger: Logger
}

export function makeAbort<TSpec extends SpecType, TType extends 'classic' | 'ufg'>({
  eyes,
  environments: defaultEnvironments,
  logger: mainLogger,
}: Options<TSpec, TType>) {
  return async function abort({
    settings,
    logger = mainLogger,
  }: {
    settings?: AbortSettings<TType>
    logger?: Logger
  } = {}): Promise<void> {
    logger = logger.extend(mainLogger, {tags: [`abort-${utils.general.shortid()}`]})

    const typedEyes = await eyes.getTypedEyes({logger})

    settings ??= {}
    if (typedEyes.type === 'classic' && !utils.types.isEmpty(defaultEnvironments)) {
      settings.environments ??= defaultEnvironments
    }

    await typedEyes.abort({settings, logger})
  }
}
