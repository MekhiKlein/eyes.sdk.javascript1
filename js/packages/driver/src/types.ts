import type {Location, Size, Region} from '@applitools/utils'

export type ScreenOrientation = 'portrait' | 'landscape' | 'portrait-secondary' | 'landscape-secondary'

export type Cookie = {
  name: string
  value: string
  domain?: string
  path?: string
  expiry?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export type Capabilities = Record<string, any>

export type UserAgent =
  | string
  | {
      legacy: string
      brands: {brand: string; version: string}[]
      platform: string
      platformVersion?: string
      model?: string
      mobile?: boolean
    }

export type Environment = {
  browserName?: string
  browserVersion?: string
  platformName?: string
  platformVersion?: string
  deviceName?: string

  isReliable?: boolean

  isW3C?: boolean
  isEC?: boolean
  isECClient?: boolean
  isApplitoolsLib?: boolean

  isWeb?: boolean
  isNative?: boolean
  isMobile?: boolean
  isEmulation?: boolean

  isIE?: boolean
  isEdge?: boolean
  isEdgeLegacy?: boolean
  isChrome?: boolean
  isChromium?: boolean

  isAndroid?: boolean
  isIOS?: boolean
  isMac?: boolean
  isWindows?: boolean
}

export type Viewport = {
  displaySize?: Size
  viewportSize: Size
  viewportLocation?: Location
  orientation?: ScreenOrientation
  pixelRatio: number
  viewportScale: number
  statusBarSize?: number
  navigationBarSize?: number
  safeArea?: Region
}

export type Features = {
  nestedSelectors?: boolean
  allCookies?: boolean
  canExecuteOnlyFunctionScripts?: boolean
}

export type DriverInfo = {
  sessionId?: string
  remoteHostname?: string

  userAgent?: UserAgent | null
  capabilities?: Capabilities | null
  viewport?: Partial<Viewport>
  environment?: Partial<Environment>
  features?: Features
}
