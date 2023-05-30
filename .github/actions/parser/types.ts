export interface Job {
  name: string,
  'display-name': string,
  'package-name': string,
  'artifact-name': string,
  path: string,
  tag: string,
  runner?: string,
  'framework-version'?: string,
  'node-version'?: string,
  'java-version'?: string,
  'python-version'?: string,
  'ruby-version'?: string,
  links?: string,
  env?: Record<string, string>,
  requested: boolean,
}

export interface Package {
  name: string
  component: string
  path: string
  tag: string
  dependencies: string[]
  builds: Record<string, any>[]
  tests: Record<string, any>[]
  releases: Record<string, any>[]
}
