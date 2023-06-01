export interface Job {
  name: string
  description?: string
  'display-name': string
  'package-name': string
  'artifact-name': string
  'working-directory': string
  runner?: string
  container?: string
  'framework-version'?: string
  'node-version'?: string
  'java-version'?: string
  'python-version'?: string
  'ruby-version'?: string
  'test-type'?: string
  'build-type'?: string
  'setup-type'?: string
  links?: string
  env?: Record<string, string>
  cache?: Cache | Cache[]
}

export interface Cache {
  key: string
  path: string[]
}

export interface Package {
  name: string
  component: string
  path: string
  dependencies: string[]
  builds: Record<string, any>[]
  tests: Record<string, any>[]
  releases: Record<string, any>[]
}
