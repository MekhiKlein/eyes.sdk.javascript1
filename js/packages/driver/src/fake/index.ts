import {type SpecDriver, type SpecType} from '../spec-driver'
import * as fakeSpec from './spec-driver'

export {MockDriver} from './mock-driver'
export type Driver = fakeSpec.Driver
export type Element = fakeSpec.Element
export type Selector = fakeSpec.Selector
export const spec: SpecDriver<SpecType<Driver, Driver, Element, Selector>> = fakeSpec
