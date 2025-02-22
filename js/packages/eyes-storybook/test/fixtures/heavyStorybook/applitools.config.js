module.exports = {
  concurrency: 1000,
  // showLogs: true,
  appName: 'Heavy storybook',
  batchName: 'Heavy storybook',
  storybookConfigDir: 'test/fixtures/heavyStorybook/',
  storybookStaticDir: 'test/fixtures',
  // storybookPort: 9002,
  // storybookUrl: 'http://localhost:9002', // need to run `yarn storybook:heavy` in a separate terminal
  // browser: [
  //   {width: 1000, height: 600, name: 'chrome'},
  //   {width: 1000, height: 600, name: 'firefox'},
  //   {width: 1000, height: 600, name: 'edgechromium'},
  //   {width: 1000, height: 600, name: 'edgelegacy'},
  //   {width: 1000, height: 600, name: 'ie10'},
  //   {width: 1000, height: 600, name: 'ie11'},
  //   {width: 1000, height: 600, name: 'safari'},
  //   {width: 1000, height: 600, name: 'chrome-one-version-back'},
  //   {width: 1000, height: 600, name: 'chrome-two-versions-back'},
  //   {width: 1000, height: 600, name: 'firefox-one-version-back'},
  //   {width: 1000, height: 600, name: 'firefox-two-versions-back'},
  //   {width: 1000, height: 600, name: 'safari-one-version-back'},
  //   {width: 1000, height: 600, name: 'safari-two-versions-back'},
  //   {width: 1000, height: 600, name: 'edgechromium-one-version-back'},
  //   {width: 1000, height: 600, name: 'edgechromium-two-versions-back'},
  // ],
  // waitBeforeCapture: 300,
  // puppeteerOptions: {
  //   headless: false,
  // },
  disableBrowserFetching: true,
  include: (() => {
    let count = 0;
    return () => count++ < 500;
  })()
};
