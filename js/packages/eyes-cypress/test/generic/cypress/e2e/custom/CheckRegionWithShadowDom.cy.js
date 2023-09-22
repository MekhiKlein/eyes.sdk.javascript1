describe('Coverage tests', () => {
  it('check region with shadow dom', () => {
    cy.visit('https://applitools.github.io/demo/TestPages/ShadowDOM/index.html')
    cy.eyesOpen({
      appName: 'some app',
      testName: 'region in shadow dom',
      browser: {width: 800, height: 600},
    })
    cy.eyesCheckWindow({
      target: 'region',
      tag: 'region in nested shadow dom',
      selector: [
        {
          type: 'css',
          selector: '#has-shadow-root',
          nodeType: 'shadow-root',
        },
        {
          type: 'css',
          selector: '#has-shadow-root-nested > div',
          nodeType: 'shadow-root',
        },
        {
          type: 'css',
          selector: 'div',
          nodeType: 'element',
        },
      ],
    })
    cy.eyesCheckWindow({
      target: 'region',
      tag: 'region in shadow dom',
      selector: [
        {
          type: 'css',
          selector: '#has-shadow-root',
          nodeType: 'shadow-root',
        },
        {
          type: 'css',
          selector: 'h1',
          nodeType: 'element',
        },
      ],
    })
    cy.eyesClose()
  })
})
