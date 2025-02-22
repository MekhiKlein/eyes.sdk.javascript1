module.exports = {
  name: "eyes_playwright_dotnet",
  emitter: "https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/DotNet/playwright/emitter.js",
  overrides: [
    "https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/js/overrides.js",
    "https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/DotNet/overrides/overrides-playwright.js"
  ],
  template: "https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/DotNet/playwright/template.hbs",
  tests: "https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/coverage-tests.js",
  ext: ".cs",
  outPath: './test/Playwright/coverage/generic',
  emitOnly: test => {
    return !test.name.startsWith("appium") && 
           !test.name.includes('on android') &&
           !test.name.includes('on ios') &&
          (!test.features || (!test.features.includes('image') && 
                              !test.features.includes('native-selectors') &&
                              !test.features.includes('sauce')))
  },
};