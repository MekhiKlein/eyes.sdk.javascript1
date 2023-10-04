import type {DriverTarget, Core, Eyes, EyesStorage, OpenSettings, VisualTest} from './types'
import {type Logger} from '@applitools/logger'
import {makeDriver, type SpecType, type SpecDriver} from '@applitools/driver'
import {makeGetBaseEyes} from './get-base-eyes'
import {makeCheck} from './check'
import {makeCheckAndClose} from './check-and-close'
import {makeClose} from '../automation/close'
import {makeAbort} from '../automation/abort'
import {makeGetResults} from '../automation/get-results'
import {extractDefaultEnvironments} from './utils/extract-default-environment'
import {AbortController} from 'abort-controller'
import * as utils from '@applitools/utils'

type Options<TSpec extends SpecType> = {
  core: Core<TSpec>
  spec?: SpecDriver<TSpec>
  logger: Logger
}

export function makeOpenEyes<TSpec extends SpecType>({core, spec, logger: mainLogger}: Options<TSpec>) {
  return async function openEyes({
    target,
    settings,
    storage = new Map(),
    logger = mainLogger,
  }: {
    target?: DriverTarget<TSpec>
    settings: OpenSettings
    storage?: EyesStorage
    logger?: Logger
  }): Promise<Eyes<TSpec>> {
    logger = logger.extend(mainLogger)

    logger.log(
      `Command "openEyes" is called with ${target ? 'default driver' : ''}`,
      ...(settings ? ['and settings', settings] : []),
      storage.size > 0 ? 'and default eyes storage' : '',
    )

    const driver = target && (await makeDriver({spec, driver: target, logger}))
    if (driver && storage.size === 0) {
      const environment = await driver.getEnvironment()
      if (settings.environment?.viewportSize && !environment.isMobile) {
        await driver.setViewportSize(settings.environment.viewportSize)
      }
      settings.environment ??= {}
      if (environment.isEC) {
        settings.environment.ecSessionId = (await driver.getSessionId()) ?? undefined
      }
    }
    const environments = await extractDefaultEnvironments({driver})
    const controller = new AbortController()
    const account = await core.getAccountInfo({settings, logger})
    return utils.general.extend({}, eyes => {
      return {
        type: 'ufg' as const,
        core,
        test: {
          userTestId: settings.userTestId,
          batchId: settings.batch?.id,
          keepBatchOpen: settings.keepBatchOpen,
          eyesServer: account.eyesServer,
          ufgServer: account.ufgServer,
          uploadUrl: account.uploadUrl,
          stitchingServiceUrl: account.stitchingServiceUrl,
          supportedEnvironmentsUrl: account.supportedEnvironmentsUrl,
          account,
        } as VisualTest,
        running: true,
        storage,
        getBaseEyes: makeGetBaseEyes({settings, eyes, logger}),
        check: makeCheck({eyes, target: driver, environments, spec, signal: controller.signal, logger}),
        checkAndClose: makeCheckAndClose({eyes, target: driver, environments, spec, signal: controller.signal, logger}),
        close: makeClose({eyes, target: driver, logger}),
        abort: makeAbort({eyes, target: driver, spec, controller, logger}),
        getResults: makeGetResults({eyes, logger}),
      }
    })
  }
}
