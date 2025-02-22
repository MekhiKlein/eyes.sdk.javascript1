const path = require('path')
const utils = require('@applitools/utils')

async function testServerInProcess(args = {}) {
  let resolve, reject
  const ret = new Promise((r, j) => {
    resolve = r
    reject = j
  })
  const filepath = path.resolve(__dirname, './cli/test-server.js')
  const spawnArgs = [
    filepath,
    ...Object.entries(args).reduce(
      (acc, [key, value]) => acc.concat([`--${key}`, typeof value === 'object' ? JSON.stringify(value) : value]),
      [],
    ),
  ]
  const {subProcess, exitPromise} = utils.process.executeAndControlProcess('node', spawnArgs, {
    spawnOptions: {stdio: ['pipe', 'pipe', 'pipe', 'ipc']},
  })

  exitPromise.catch(ex => {
    if (ex.signal !== 'SIGTERM') throw ex
  })

  subProcess.on('message', ({success, port, err}) => {
    if (success) {
      resolve({close: () => subProcess.kill(), port})
    } else {
      reject(new Error(err))
    }
  })

  return ret
}

module.exports = testServerInProcess
