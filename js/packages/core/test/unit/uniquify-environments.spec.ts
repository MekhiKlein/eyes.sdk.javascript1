import {uniquifyEnvironments} from '../../src/automation/utils/uniquify-environments'
import assert from 'assert'

describe('uniquify-environments', () => {
  it(`adds unique id to duplicated environments without id`, () => {
    const results = uniquifyEnvironments([
      {name: 'firefox', width: 100, height: 100, environmentId: '1'},
      {name: 'firefox', width: 100, height: 100},
      {name: 'firefox', width: 100, height: 100},
      {name: 'firefox', width: 100, height: 100, environmentId: '2'},
    ])
    assert.deepStrictEqual(results, [
      {name: 'firefox', width: 100, height: 100, environmentId: '1'},
      {name: 'firefox', width: 100, height: 100},
      {name: 'firefox', width: 100, height: 100, environmentId: '3'},
      {name: 'firefox', width: 100, height: 100, environmentId: '2'},
    ])
  })

  it(`removes duplicated environments with id`, () => {
    const results = uniquifyEnvironments([
      {name: 'firefox', width: 100, height: 100, environmentId: 'bla'},
      {name: 'firefox', width: 100, height: 100, environmentId: 'bla'},
    ])
    assert.deepStrictEqual(results, [{name: 'firefox', width: 100, height: 100, environmentId: 'bla'}])
  })

  it(`doesn't changes environments if there are no duplications`, () => {
    const results = uniquifyEnvironments([
      {name: 'firefox', width: 100, height: 100},
      {name: 'chrome', width: 100, height: 100},
    ])
    assert.deepStrictEqual(results, [
      {name: 'firefox', width: 100, height: 100},
      {name: 'chrome', width: 100, height: 100},
    ])
  })

  it(`doesn't changes environments if all of the duplications already have unique id`, () => {
    const results = uniquifyEnvironments([
      {name: 'firefox', width: 100, height: 100},
      {name: 'firefox', width: 100, height: 100},
    ])
    assert.deepStrictEqual(results, [
      {name: 'firefox', width: 100, height: 100},
      {name: 'firefox', width: 100, height: 100, environmentId: '1'},
    ])
  })
})
