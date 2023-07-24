describe('Coverage tests', () => {
  it('check region with DOM element', () => {
    cy.visit('https://applitools.github.io/demo/TestPages/FramesTestPage/')
    cy.eyesOpen({
      appName: 'some app',
      testName: 'check region with DOM element',
      browser: {width: 1024, height: 768},
    })
    cy.get('#overflowing-div').then($el => {
      cy.eyesCheckWindow({
        tag: 'region',
        target: 'region',
        element: $el[0],
      })
    })
    cy.eyesClose()
  })
})
