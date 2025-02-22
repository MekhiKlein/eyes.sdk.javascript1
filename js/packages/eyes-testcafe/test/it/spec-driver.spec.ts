import {Selector, ClientFunction} from 'testcafe'
import * as assert from 'assert'
import * as spec from '../../src/spec-driver'

function isEqualElements(t: spec.Driver, element1: spec.Element, element2: spec.Element) {
  if (!element1 || !element2) return false
  const compareElements = ClientFunction(() => element1() === element2(), {
    boundTestRun: t,
    dependencies: {element1, element2},
  })
  return compareElements()
}

fixture`spec-driver`.page`https://applitools.github.io/demo/TestPages/FramesTestPage/`

test('isDriver(driver)', async driver => {
  assert.strictEqual(spec.isDriver(driver), true)
})
test('isDriver(wrong)', async () => {
  assert.strictEqual(spec.isDriver({}), false)
})
test('isElement(Selector)', async () => {
  const element = Selector('div')
  assert.strictEqual(spec.isElement(element), true)
})
test('isElement(wrong)', async () => {
  assert.strictEqual(spec.isElement({}), false)
})
test('isSecondaryElement(NodeSnapshot)', async () => {
  const element = await Selector('div')()
  assert.strictEqual(spec.isSecondaryElement(element), true)
})
test('isSecondaryElement(wrong)', async () => {
  assert.strictEqual(spec.isSecondaryElement({}), false)
})
test('isSelector(Selector)', async () => {
  assert.strictEqual(spec.isSelector(Selector('div')), true)
})
test('isSelector(wrong)', async () => {
  assert.strictEqual(spec.isSelector({}), false)
})
test('findElement(Selector)', async driver => {
  const element = await spec.findElement(driver, Selector('#overflowing-div'))
  assert.strictEqual(spec.isElement(element), true)
})
test('findElement(non-existent)', async driver => {
  const element = await spec.findElement(driver, Selector('#non-existent'))
  assert.strictEqual(element, null)
})
test('findElements(Selector)', async driver => {
  const elements = await spec.findElements(driver, Selector('div'))
  assert.ok(elements.length > 1)
  assert.ok(!(await isEqualElements(driver, elements[0], elements[1])))
})
test('findElements(non-existent)', async driver => {
  const elements = await spec.findElements(driver, Selector('#non-existent'))
  assert.deepStrictEqual(elements, [])
})
test('executeScript(string)', async driver => {
  assert.deepStrictEqual(await spec.executeScript(driver, 'return 4'), 4)
})
test('executeScript(string, {a, b})', async driver => {
  assert.deepStrictEqual(await spec.executeScript(driver, 'return arguments[0].a + arguments[0].b', {a: 4, b: 5}), 9)
})
test('executeScript(function, {a, b})', async driver => {
  const script = function (arg: {a: number; b: number}) {
    return arg.a + arg.b
  }
  assert.deepStrictEqual(await spec.executeScript(driver, script, {a: 4, b: 5}), 9)
})
test('executeScript w/ Selector', async driver => {
  const script = 'return arguments[0].style.width'
  const selector = Selector('#overflowing-div')
  assert.deepStrictEqual(await spec.executeScript(driver, script, selector), '300px')
})
test('executeScript re-use returned element', async driver => {
  const result = await spec.executeScript(driver, 'return arguments[0]', Selector('h1'))
  const actual = await spec.executeScript(
    driver,
    "return getComputedStyle(arguments[0]).getPropertyValue('overflow')",
    result,
  )
  assert.deepStrictEqual(actual, 'visible')
})
test('executeScript re-use returned element (when the element changes)', async driver => {
  const expected = 'blah'
  const target = await spec.executeScript(driver, 'return arguments[0]', Selector('h1'))
  await spec.executeScript(driver, `document.querySelector('h1').textContent = '${expected}'`)
  const result = await spec.executeScript(driver, 'return arguments[0]', target)
  const actual = await result.innerText
  assert.deepStrictEqual(actual, expected)
})
test('executeScript return mixed data-types (Array)', async driver => {
  const expected = 2
  const result = await spec.executeScript(driver, 'return [0, arguments[0]]', Selector('h1'))
  const actual = result.length
  assert.deepStrictEqual(actual, expected)
})
test('executeScript return mixed data-types (Object)', async driver => {
  const expected = 2
  const result = await spec.executeScript(driver, "return {element: arguments[0], blah: 'blah'}", Selector('h1'))
  const actual = Object.entries(result).length
  assert.deepStrictEqual(actual, expected)
})
test('executeScript with serialized arguments', async driver => {
  const fn = function ({element}: {element: HTMLElement}) {
    return element.style.overflow
  }
  await spec.executeScript(driver, fn, {element: Selector('html')})
})
test('mainContext()', async driver => {
  try {
    const isMainContext = ClientFunction(() => window.top === window)
    await driver.switchToIframe('[name="frame1"]')
    await driver.switchToIframe('[name="frame1-1"]')
    assert.ok(!(await isMainContext()))
    await spec.mainContext(driver)
    assert.ok(await isMainContext())
  } finally {
    await driver.switchToMainWindow().catch(() => null)
  }
})
test('childContext(element)', async driver => {
  try {
    const isMainContext = ClientFunction(() => window.top === window)
    await driver.switchToIframe('[name="frame1"]')
    assert.ok(!(await isMainContext()))
    await driver.switchToMainWindow()
    await spec.childContext(driver, Selector('[name="frame1"]'))
    assert.ok(!(await isMainContext()))
  } finally {
    await driver.switchToMainWindow().catch(() => null)
  }
})
test('getTitle()', async driver => {
  const expected = 'Cross SDK test'
  const actual = await spec.getTitle(driver)
  assert.deepStrictEqual(actual, expected)
})
test('getTitle() when not present', async driver => {
  await spec.visit(driver, 'http://applitools.github.io/demo/TestPages/fixed-position')
  const expected = ''
  const actual = await spec.getTitle(driver)
  assert.deepStrictEqual(actual, expected)
})
test('getUrl()', async driver => {
  const expected = 'https://applitools.github.io/demo/TestPages/FramesTestPage/'
  const result = await spec.getUrl(driver)
  assert.deepStrictEqual(result, expected)
})
test('visit()', async driver => {
  let startUrl
  try {
    startUrl = await spec.getUrl(driver)
    const blank = 'about:blank'
    await spec.visit(driver, blank)
    const actual = await spec.getUrl(driver)
    assert.deepStrictEqual(actual, blank)
  } finally {
    await driver.navigateTo(startUrl!)
  }
})
test('takeScreenshot', async driver => {
  const screenshot = await spec.takeScreenshot(driver)
  assert.ok(Buffer.isBuffer(screenshot))
})
test('setViewportSize(width, height)', async driver => {
  const expectedRect = {width: 500, height: 500}
  await spec.setViewportSize(driver, expectedRect)
  const actualRect = await driver.eval(() => ({
    width: window.innerWidth, // eslint-disable-line no-undef
    height: window.innerHeight, // eslint-disable-line no-undef
  }))
  assert.deepStrictEqual(actualRect, expectedRect)
})
