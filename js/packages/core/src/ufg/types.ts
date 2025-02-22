import type {MaybeArray, Region} from '@applitools/utils'
import type * as AutomationCore from '../automation/types'
import {type Selector, type SpecType} from '@applitools/driver'
import {type Logger} from '@applitools/logger'
import {type Proxy} from '@applitools/req'
import {
  type UFGClient,
  type UFGClientSettings,
  type DomSnapshot,
  type AndroidSnapshot,
  type IOSSnapshot,
} from '@applitools/ufg-client'

export * from '../automation/types'

export type SnapshotTarget =
  | MaybeArray<SnapshotResult<DomSnapshot>>
  | MaybeArray<AndroidSnapshot>
  | MaybeArray<IOSSnapshot>
export type Target<TSpec extends SpecType> = SnapshotTarget | AutomationCore.Target<TSpec>

export type SnapshotResult<TSnapshotType extends DomSnapshot | AndroidSnapshot | IOSSnapshot> = {
  snapshot: TSnapshotType
  selectorsToCalculate?: {originalSelector: Selector | null; safeSelector: Selector | null}[]
  regionToTarget?: Selector | Region
  scrollRootSelector?: Selector
}

export interface Core<TSpec extends SpecType> extends AutomationCore.Core<TSpec> {
  readonly type: 'ufg'
  getUFGClient(options?: {settings: UFGClientSettings; logger?: Logger}): Promise<UFGClient>
  openEyes(options: {
    target?: AutomationCore.DriverTarget<TSpec>
    settings: AutomationCore.OpenSettings
    storage?: AutomationCore.EyesStorage
    logger?: Logger
  }): Promise<Eyes<TSpec>>
}

export interface Eyes<TSpec extends SpecType> extends AutomationCore.Eyes<TSpec> {
  readonly type: 'ufg'
  readonly core: Core<TSpec>
  check(options?: {target?: Target<TSpec>; settings?: CheckSettings<TSpec>; logger?: Logger}): Promise<void>
  checkAndClose(options?: {
    target?: Target<TSpec>
    settings?: CheckSettings<TSpec> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<void>
}

export type CheckSettings<TSpec extends SpecType> = AutomationCore.CheckSettings<TSpec> & {
  hooks?: {beforeCaptureScreenshot: string}
  disableBrowserFetching?: boolean
  layoutBreakpoints?: {breakpoints: number[] | boolean; reload?: boolean}
  ufgOptions?: Record<string, any>
  autProxy?: Proxy & {mode?: 'Allow' | 'Block'; domains?: string[]}
  headers?: Record<string, string>
}
