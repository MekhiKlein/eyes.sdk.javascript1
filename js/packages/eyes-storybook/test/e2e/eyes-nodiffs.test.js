const {describe, it, before, after} = require('mocha');
const path = require('path');
const {testServerInProcess} = require('@applitools/test-server');
const {spawn} = require('child_process');
const {expect} = require('chai');

const envWithColor = {...process.env, FORCE_COLOR: true};
const spawnOptions = {stdio: 'pipe', env: envWithColor};

describe('eyes-storybook nodiff exitcode', () => {
  let closeTestServer, showLogsOrig;
  before(async () => {
    closeTestServer = (await testServerInProcess({port: 7272})).close;
    showLogsOrig = process.env.APPLITOOLS_SHOW_LOGS;
    if (showLogsOrig) {
      console.warn(
        '\nThis test disables APPLITOOLS_SHOW_LOGS so dont be surprised son !!! See: test/e2e/eyes-storybook.e2e.test.js:15\n',
      );
    }
    delete process.env.APPLITOOLS_SHOW_LOGS;
  });

  after(async () => {
    await closeTestServer();
    process.env.APPLITOOLS_SHOW_LOGS = '';
  });

  it('dont fail on diffs', async () => {
    const command = `node ${path.resolve(__dirname, '../../bin/eyes-storybook')} -f ${path.resolve(
      __dirname,
      'happy-config/nodiffs.config.js',
    )}`;

    const child = await spawn(command, [], {
      stdio: 'pipe',
      shell: '/bin/sh',
      ...spawnOptions,
    });

    const exitCode = await new Promise((resolve, _reject) => {
      child.on('exit', code => {
        resolve(code);
      });
    });

    expect(exitCode).to.equal(0);
  });
});
