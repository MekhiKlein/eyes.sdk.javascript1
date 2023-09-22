const config = {
  saveNewTests: false,
  batch: {
    name: 'JS Coverage Tests - Cypress',
  },
  parentBranchName: 'master',
  branchName: 'master',
  testConcurrency: 100,
  failCypressAfterAllSpecs: true,
};

module.exports = config;
