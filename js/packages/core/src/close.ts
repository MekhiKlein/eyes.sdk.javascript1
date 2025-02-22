import type {Eyes, Config, CloseSettings, Renderer} from './types'
import {type SpecType} from '@applitools/driver'
import {type Logger} from '@applitools/logger'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType, TType extends 'classic' | 'ufg'> = {
  eyes: Eyes<TSpec, TType>
  renderers?: Renderer[]
  logger: Logger
}

export function makeClose<TSpec extends SpecType, TType extends 'classic' | 'ufg'>({
  eyes,
  renderers: defaultRenderers,
  logger: mainLogger,
}: Options<TSpec, TType>) {
  return async function close({
    settings,
    config,
    logger = mainLogger,
  }: {
    settings?: CloseSettings<TType>
    config?: Config<TSpec, TType>
    logger?: Logger
  } = {}): Promise<void> {
    logger = logger.extend(mainLogger, {tags: [`close-${utils.general.shortid()}`]})

    const typedEyes = await eyes.getTypedEyes({logger})

    settings = {...config?.close, ...settings}
    settings.updateBaselineIfNew ??= true
    if (typedEyes.type === 'classic' && !utils.types.isEmpty(defaultRenderers)) {
      settings.renderers ??= defaultRenderers
    }

    await typedEyes.close({settings, logger})
  }
}
