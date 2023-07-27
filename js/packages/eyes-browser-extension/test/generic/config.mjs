import * as path from 'path'

export const config = {
  extends: '../../../../test/generic/config.mjs',
  env: {
    NO_SDK: true,
    SPEC_DRIVER: path.resolve('./test/utils/spec-driver.js'),
    SETUP_EYES: path.resolve('./test/utils/setup-eyes.js'),
  },
  overrides: [
    '../../../../test/generic/overrides.mjs',
    test => {
      if (!test.vg) return {config: {branchName: 'onscreen'}}
    },
    test => {
      if (test.api === 'classic') return {skipEmit: true}
    },
    {
      // not possible because of browser api
      'should not fail if scroll root is stale': {skipEmit: true},
      'should return test results from close with failed classic test': {skipEmit: true}, // no data classes
      'should return test results from close with failed vg test': {skipEmit: true}, // no data classes
      'should return test results from close with passed classic test': {skipEmit: true}, // no data classes
      'should return test results from close with passed vg test': {skipEmit: true}, // no data classes
      // not possible because of core api
      'should throw if no checkpoints before close': {skipEmit: true},
      'should return actual viewport size': {skipEmit: true}, // no data classes
      'should not check if disabled': {skipEmit: true},
      // not possible due to onscreen mode
      'check window with layout breakpoints': {skipEmit: true},
      'check window with layout breakpoints in config': {skipEmit: true},
    },
  ],
}
