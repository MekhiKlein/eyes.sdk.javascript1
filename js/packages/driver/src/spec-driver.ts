import type {Size, Region} from '@applitools/utils'
import type {DriverInfo, Capabilities, ScreenOrientation, Cookie} from './types'
import {type CommonSelector} from './selector'

export type SpecType<
  TDriver = unknown,
  TContext = unknown,
  TElement = unknown,
  TSelector = unknown,
  TSecondary extends SpecType = SpecType<unknown, unknown, unknown, unknown, never>,
> = {
  driver: TDriver
  context: TContext
  element: TElement
  selector: TSelector
  secondary: TSecondary
}

export interface SpecDriver<T extends SpecType> {
  /**
   * Assures that the given driver has a speced type.
   */
  isDriver(driver: any): driver is T['driver']
  /**
   * Assures that the given driver has a secondary type.
   */
  isSecondaryDriver?(driver: any): driver is T['secondary']['driver']
  /**
   * Assures that the given context has a speced type.
   * (applicable only to cdp-like specs.)
   */
  isContext?(context: any): context is T['context']
  /**
   * Assures that the given context has a secondary type.
   */
  isSecondaryContext?(context: any): context is T['secondary']['context']
  /**
   * Assures that the given element has a speced type.
   */
  isElement(element: any): element is T['element']
  /**
   * Assures that the given element has a secondary type.
   */
  isSecondaryElement?(element: any): element is T['secondary']['element']
  /**
   * Assures that the given selector has a speced context.
   */
  isSelector(selector: any): selector is T['selector']
  /**
   * Assures that the given selector has a secondary type.
   */
  isSecondarySelector?(selector: any): selector is T['secondary']['selector']
  /**
   * Assures that two given elements are equal.
   * (should be implemented only if there is different a different method then in-browser comparison.)
   */
  isEqualElements?(context: T['context'], element1: T['element'], element2: T['element']): boolean | Promise<boolean>
  /**
   * Assures that the error is a stale element error.
   */
  isStaleElementError?(error: any, selector?: T['selector']): boolean
  /**
   * Converts the given driver to a speced driver.
   * (applicable in cases when spec has certain variations or sub-types of the driver.)
   */
  toDriver?(driver: T['secondary']['driver']): T['driver'] | Promise<T['driver']>
  /**
   * Transforms the given element to a speced element.
   * (applicable in cases when spec has certain variations or sub-types of the element.)
   */
  toElement?(element: T['secondary']['element']): T['element'] | Promise<T['element']>
  /**
   * Transforms the given common selector to a speced selector.
   */
  toSelector?(selector: T['secondary']['selector'] | CommonSelector<T['selector']>): T['selector']
  /**
   * Transforms the given speced selector to simple common selector if possible.
   */
  toSimpleCommonSelector?(selector: T['selector']): CommonSelector | null
  /**
   * Extracts context from the given driver.
   */
  extractContext?(element: T['driver']): T['context']
  /**
   * Extracts selector from the given element if possible.
   * (should be implemented in cases when speced type of the element contains selector in itself.)
   */
  extractSelector?(element: T['element']): T['selector'] | null

  /**
   * Executes given script in the given contexts with given argument.
   */
  executeScript(context: T['context'], script: ((arg?: any) => any) | string, arg?: any): Promise<any>
  findElement(context: T['context'], selector: T['selector'], parent?: T['element']): Promise<T['element'] | null>
  findElements(context: T['context'], selector: T['selector'], parent?: T['element']): Promise<T['element'][]>
  waitForSelector?(
    context: T['context'],
    selector: T['selector'],
    parent?: T['element'],
    options?: WaitOptions,
  ): Promise<T['element'] | null>
  getElementRegion?(context: T['context'], element: T['element']): Promise<Region>
  getElementAttribute?(context: T['context'], element: T['element'], attr: string): Promise<string>
  setElementText?(context: T['context'], element: T['element'], text: string): Promise<void>
  getElementText?(context: T['context'], element: T['element']): Promise<string>
  hover?(context: T['context'], element: T['element']): Promise<void>
  click?(context: T['context'], element: T['element']): Promise<void>
  mainContext(context: T['context']): Promise<T['context']>
  parentContext?(context: T['context']): Promise<T['context']>
  childContext(context: T['context'], element: T['element']): Promise<T['context']>

  getDriverInfo?(driver: T['driver']): Promise<DriverInfo>
  getCapabilities?(driver: T['driver']): Promise<Capabilities>
  setWindowSize?(driver: T['driver'], size: Size): Promise<void>
  getWindowSize?(driver: T['driver']): Promise<Size>
  setViewportSize?(driver: T['driver'], size: Size): Promise<void>
  getViewportSize?(driver: T['driver']): Promise<Size>
  getOrientation?(driver: T['driver']): Promise<ScreenOrientation>
  setOrientation?(driver: T['driver'], orientation: ScreenOrientation): Promise<void>
  getSystemBars?(driver: T['driver']): Promise<{
    statusBar: {visible: boolean; x: number; y: number; height: number; width: number}
    navigationBar: {visible: boolean; x: number; y: number; height: number; width: number}
  }>
  getCookies?(driver: T['driver'] | T['context'], context?: boolean): Promise<Cookie[]>
  getTitle?(driver: T['driver']): Promise<string>
  getUrl?(driver: T['driver']): Promise<string>
  visit?(driver: T['driver'], url: string): Promise<void>
  performAction?(driver: T['driver'], steps: any[]): Promise<void>
  takeScreenshot(driver: T['driver']): Promise<Uint8Array | string>
  getCurrentWorld?(driver: T['driver']): Promise<string>
  getWorlds?(driver: T['driver']): Promise<string[]>
  switchWorld?(driver: T['driver'], id: string): Promise<void>
}

export type WaitOptions = {
  state?: 'exist' | 'visible'
  interval?: number
  timeout?: number
}
