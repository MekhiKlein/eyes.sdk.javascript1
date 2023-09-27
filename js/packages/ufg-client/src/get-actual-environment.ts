import type {GetActualEnvironmentSettings, ActualEnvironment} from './types'
import {type UFGRequests} from './server/requests'
import {mergeLoggers, type Logger} from '@applitools/logger'
import * as utils from '@applitools/utils'

type Options = {
  requests: UFGRequests
  batchingTimeout?: number
  logger: Logger
}

export function makeGetActualEnvironment({requests, batchingTimeout = 100, logger: mainLogger}: Options) {
  const getActualEnvironmentsWithBatching = utils.general.batchify(getActualEnvironments, {timeout: batchingTimeout})

  return function getActualEnvironment({
    settings,
    logger = mainLogger,
  }: {
    settings: GetActualEnvironmentSettings
    logger?: Logger
  }) {
    logger = logger.extend(mainLogger, {tags: [`get-actual-environment-${utils.general.shortid()}`]})
    return getActualEnvironmentsWithBatching({settings, logger})
  }

  async function getActualEnvironments(
    batch: [
      {settings: GetActualEnvironmentSettings; logger: Logger},
      {resolve(result: ActualEnvironment): void; reject(reason?: any): void},
    ][],
  ) {
    const logger = mergeLoggers(...batch.map(([{logger}]) => logger))
    try {
      const environments = await requests.getActualEnvironments({
        settings: batch.map(([{settings}]) => settings),
        logger,
      })
      environments.forEach((environment, index) => {
        const [, {resolve}] = batch[index]
        resolve(environment)
      })
    } catch (err) {
      batch.forEach(([, {reject}]) => reject(err))
    }
  }
}
