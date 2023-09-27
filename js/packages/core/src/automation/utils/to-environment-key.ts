import type {Environment} from '../types'
import * as utils from '@applitools/utils'

export function toEnvironmentKey(environment: Environment) {
  return JSON.stringify(utils.types.has(environment, 'requested') ? environment.requested : environment)
}
