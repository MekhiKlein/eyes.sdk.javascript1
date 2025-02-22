import type * as AutomationCore from '../automation/types'
import {type SpecType} from '@applitools/driver'
import {type Logger} from '@applitools/logger'

export * from '../automation/types'

export interface Core<TSpec extends SpecType> extends AutomationCore.Core<TSpec> {
  readonly type: 'classic'
  openEyes(options: {
    target?: AutomationCore.DriverTarget<TSpec>
    settings: OpenSettings
    storage?: AutomationCore.EyesStorage
    logger?: Logger
  }): Promise<Eyes<TSpec>>
}

export interface Eyes<TSpec extends SpecType> extends AutomationCore.Eyes<TSpec> {
  readonly type: 'classic'
  readonly core: Core<TSpec>
  check(options?: {
    target?: AutomationCore.Target<TSpec>
    settings?: CheckSettings<TSpec>
    logger?: Logger
  }): Promise<void>
  checkAndClose(options?: {
    target?: AutomationCore.Target<TSpec>
    settings?: CheckSettings<TSpec> & AutomationCore.CloseSettings
    logger?: Logger
  }): Promise<void>
}

export type OpenSettings = AutomationCore.OpenSettings & {
  useCeilForViewportSize?: boolean
  keepPlatformNameAsIs?: boolean
}

export type CheckSettings<TSpec extends SpecType> = AutomationCore.CheckSettings<TSpec> & {
  retryTimeout?: number
}
