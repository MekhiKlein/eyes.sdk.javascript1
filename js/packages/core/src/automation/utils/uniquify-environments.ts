import type {Environment} from '../types'

export function uniquifyEnvironments<TEnvironment extends Environment>(environments: TEnvironment[]): TEnvironment[] {
  const duplications = new Map(environments.map(environment => [JSON.stringify(environment), 0]))
  return environments.reduce((uniqueEnvironments, environment) => {
    const key = JSON.stringify(environment)
    let index = duplications.get(key)!
    if (index > 0) {
      if (!environment.environmentId) {
        let uniqueEnvironment: TEnvironment
        do {
          uniqueEnvironment = {...environment, environmentId: `${index}`}
          index += 1
        } while (duplications.has(JSON.stringify(uniqueEnvironment)))
        uniqueEnvironments.push(uniqueEnvironment)
      }
    } else {
      index += 1
      uniqueEnvironments.push(environment)
    }
    duplications.set(key, index)
    return uniqueEnvironments
  }, [] as TEnvironment[])
}
