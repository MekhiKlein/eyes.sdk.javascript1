import {defineConfig} from 'cypress13'
import eyesPlugin from '../../../'

export default eyesPlugin(defineConfig({
  e2e: {
    setupNodeEvents: (on, config) => {
    },
    specPattern: './**/*.spec.ts',
    video: false,
    screenshotOnRunFailure: false,
  },
}))
