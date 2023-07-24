describe('Coverage tests', () => {
  it('check window with open before visit', () => {
    cy.eyesOpen({
      appName: 'some app',
      testName: 'open before visit',
      browser: {width: 800, height: 600},
    })
    cy.visit('https://applitools.com/helloworld')
    cy.eyesCheckWindow('Main Page')
    cy.eyesClose()
  })
})
