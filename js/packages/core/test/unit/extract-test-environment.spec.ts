import assert from 'assert'
import {extractTestEnvironment} from '../../src/utils/extract-test-environment'

describe('extract test environment', async () => {
  it('extends base test environment', () => {
    const environment = extractTestEnvironment({versions: {framework: '1.0.0', lang: '20.13.0'}})
    assert.strictEqual(environment.versions.framework, '1.0.0')
    assert.strictEqual(environment.versions.lang, '20.13.0')
  })

  it('identifies github actions by env var', () => {
    process.env.GITHUB_ACTIONS = 'true'
    const environment = extractTestEnvironment()
    assert.strictEqual(environment.ci, 'GitHub Actions')
  })
})
