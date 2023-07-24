/* global cy, expect */
describe('remove duplicate tests on retry', () => {
  it('fails and retries', {retries: 2}, () => {
    const retryCount = cy.state('runnable')._currentRetry
    cy.visit('https://example.org').then(() => {
      // we wait here to make sure we get different time stamps for all tests
      cy.wait(200)
      if (retryCount < 2) cy.document().then(doc => (doc.body.style.background = 'red'))
    })
    cy.eyesOpen({appName: 'cypress e2e', testName: 'cypress retries'})
    cy.eyesCheckWindow({})
    cy.eyesClose()
    cy.then(() => {
      if (retryCount < 2) throw new Error('fail')
    })
  })
})
