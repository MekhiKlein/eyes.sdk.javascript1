describe('Coverage tests', () => {
  it('check window with chrome emulation', () => {
    cy.visit('https://applitools.com/helloworld')
    cy.eyesOpen({
      appName: 'Hello World!',
      testName: 'chrome emulation',
      browser: [
        {deviceName: 'iPhone X', screenOrientation: 'portrait'},
        {deviceName: 'Pixel 2', screenOrientation: 'portrait', name: 'chrome'},
        {chromeEmulationInfo: {deviceName: 'Nexus 10', screenOrientation: 'landscape'}},
        {
          iosDeviceInfo: {
            deviceName: 'iPhone XR',
            screenOrientation: 'portrait',
            iosVersion: 'latest',
          },
        },
      ],
    })
    cy.eyesCheckWindow('Main Page')
    cy.eyesClose()
  })
})
