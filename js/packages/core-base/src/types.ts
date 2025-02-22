import {type MaybeArray, type Region, type Size, type Location} from '@applitools/utils'
import {type Logger} from '@applitools/logger'
import {type Proxy} from '@applitools/req'

export interface ImageTarget {
  image: Uint8Array | URL | string
  size?: Size
  name?: string
  source?: string
  dom?: string
  locationInViewport?: Location // location in the viewport
  locationInView?: Location // location in view/page
  fullViewSize?: Size // full size of the view/page
  /** @internal */
  isTransformed?: boolean
}
export type Target = ImageTarget

export interface Core {
  openEyes(options: {settings: OpenSettings; logger?: Logger}): Promise<Eyes>
  openFunctionalSession(options: {settings: OpenSettings; logger?: Logger}): Promise<FunctionalSession>
  locate<TLocator extends string>(options: {
    target: Target
    settings: LocateSettings<TLocator>
    logger?: Logger
  }): Promise<LocateResult<TLocator>>
  locateText<TPattern extends string>(options: {
    target: Target
    settings: LocateTextSettings<TPattern>
    logger?: Logger
  }): Promise<LocateTextResult<TPattern>>
  extractText(options: {target: Target; settings: MaybeArray<ExtractTextSettings>; logger?: Logger}): Promise<string[]>
  getAccountInfo(options: {settings: EyesServerSettings; logger?: Logger}): Promise<Account>
  closeBatch(options: {settings: MaybeArray<CloseBatchSettings>; logger?: Logger}): Promise<void>
  deleteTest(options: {settings: MaybeArray<DeleteTestSettings>; logger?: Logger}): Promise<void>
  logEvent(options: {settings: MaybeArray<LogEventSettings>; logger?: Logger}): Promise<void>
}

export interface Eyes {
  readonly core: Core
  readonly test: VisualTest
  readonly running: boolean
  check(options: {target: Target; settings?: CheckSettings; logger?: Logger}): Promise<void>
  checkAndClose(options: {target: Target; settings?: CheckSettings & CloseSettings; logger?: Logger}): Promise<void>
  close(options?: {settings?: CloseSettings; logger?: Logger}): Promise<void>
  abort(options?: {settings?: AbortSettings; logger?: Logger}): Promise<void>
  getResults(options?: {settings?: GetResultsSettings; logger?: Logger}): Promise<TestResult[]>
}

export interface FunctionalSession {
  readonly core: Core
  readonly test: FunctionalTest
  readonly running: boolean
  close(options?: {settings?: CloseSettings; logger?: Logger}): Promise<void>
  abort(options?: {settings?: AbortSettings; logger?: Logger}): Promise<void>
  getResults(options?: {settings?: GetResultsSettings; logger?: Logger}): Promise<TestResult[]>
}

export interface VisualTest {
  testId: string
  userTestId: string
  batchId: string
  baselineId: string
  sessionId: string
  appId: string
  renderEnvironmentId?: string
  renderer?: Record<string, any>
  initializedAt: string
  isNew: boolean
  keepBatchOpen: boolean
  keepIfDuplicate: boolean
  eyesServer: EyesServerSettings
  ufgServer: UFGServerSettings
  uploadUrl: string
  renderEnvironmentsUrl: string
  stitchingServiceUrl: string
  resultsUrl: string
  account: Account
  testName: string
}

export interface FunctionalTest {
  testId: string
  userTestId: string
  batchId: string
  sessionId: string
  appId: string
  initializedAt: string
  keepBatchOpen: boolean
  keepIfDuplicate: boolean
  eyesServer: EyesServerSettings
  resultsUrl: string
  account: Account
}

export interface Account {
  eyesServer: EyesServerSettings
  ufgServer: UFGServerSettings
  stitchingServiceUrl: string
  renderEnvironmentsUrl: string
  uploadUrl: string
  maxImageHeight: number
  maxImageArea: number
  rcaEnabled: boolean
  selfHealingEnabled: boolean
  ecEnabled: boolean
}

export interface EyesServerSettings {
  eyesServerUrl: string
  apiKey: string
  agentId?: string
  proxy?: Proxy
  useDnsCache?: boolean
}

export interface UFGServerSettings {
  ufgServerUrl: string
  accessToken: string
  agentId?: string
  proxy?: Proxy
  useDnsCache?: boolean
}

export type CustomProperty = {name: string; value: string}
export type Batch = {
  id?: string
  name?: string
  sequenceName?: string
  startedAt?: Date | string
  notifyOnCompletion?: boolean
  properties?: CustomProperty[]
}
export type Environment = {
  renderEnvironmentId?: string
  ecSessionId?: string
  os?: string
  // TODO: rename to displayOs
  osInfo?: string
  hostingApp?: string
  // TODO: rename to displayHostingApp
  hostingAppInfo?: string
  deviceName?: string
  viewportSize?: Size
  userAgent?: string
  renderer?: Record<string, any>
  rawEnvironment?: Record<string, any>
  properties?: CustomProperty[]
}
export interface OpenSettings extends EyesServerSettings {
  appName: string
  testName: string
  displayName?: string
  /** @internal */
  userTestId?: string
  sessionType?: 'SEQUENTIAL' | 'PROGRESSION'
  properties?: CustomProperty[]
  batch?: Batch
  keepBatchOpen?: boolean
  environment?: Environment
  environmentName?: string
  baselineEnvName?: string
  branchName?: string
  parentBranchName?: string
  baselineBranchName?: string
  compareWithParentBranch?: boolean
  /** @internal */
  gitBranchingTimestamp?: string
  ignoreGitBranching?: boolean
  ignoreBaseline?: boolean
  saveDiffs?: boolean
  abortIdleTestTimeout?: number
  connectionTimeout?: number
  removeSession?: boolean
  isFunctionalTest?: boolean
  /** @internal */
  isComponentTest?: boolean
}

export interface LocateSettings<TLocator extends string, TRegion = Region>
  extends EyesServerSettings,
    ImageSettings<TRegion> {
  appName: string
  locatorNames: TLocator[]
  firstOnly?: boolean
  /** @internal */
  userCommandId?: string
}

export type LocateResult<TLocator extends string> = Record<TLocator, Region[]>

export interface LocateTextSettings<TPattern extends string, TRegion = Region>
  extends EyesServerSettings,
    ImageSettings<TRegion> {
  patterns: TPattern[]
  ignoreCase?: boolean
  firstOnly?: boolean
  language?: string
  /** @internal */
  userCommandId?: string
}

export type LocateTextResult<TPattern extends string> = Record<TPattern, (Region & {text: string})[]>

export interface ExtractTextSettings<TRegion = Region> extends EyesServerSettings, ImageSettings<TRegion> {
  hint?: string
  minMatch?: number
  language?: string
  /** @internal */
  userCommandId?: string
}

export interface CloseBatchSettings extends EyesServerSettings {
  batchId: string
}

export interface DeleteTestSettings extends EyesServerSettings {
  testId: string
  batchId: string
  secretToken: string
}

export interface LogEventSettings extends EyesServerSettings {
  event: {type: string} & Record<string, any>
  level?: 'Info' | 'Notice' | 'Warn' | 'Error'
  timestamp?: string
}

type OffsetRect = {top?: number; right?: number; bottom?: number; left?: number}
type ImageCropRect = OffsetRect
type ImageCropRegion = Region
export interface ImageSettings<TRegion = Region> {
  region?: TRegion
  normalization?: {
    cut?: ImageCropRect | ImageCropRegion
    rotation?: -270 | -180 | -90 | 0 | 90 | 180 | 270
    scaleRatio?: number
    limit?: {maxImageArea: number; maxImageHeight: number}
  }
  autProxy?: Proxy
  debugImages?: {path: string; prefix?: string}
}

type MatchLevel = 'None' | 'Layout' | 'Layout1' | 'Layout2' | 'Content' | 'IgnoreColors' | 'Strict' | 'Exact'
type AccessibilityRegionType = 'IgnoreContrast' | 'RegularText' | 'LargeText' | 'BoldText' | 'GraphicalObject'
type AccessibilityLevel = 'AA' | 'AAA'
type AccessibilityGuidelinesVersion = 'WCAG_2_0' | 'WCAG_2_1'
type CodedRegion<TRegion = Region> = {region: TRegion; padding?: number | OffsetRect; regionId?: string}
type FloatingRegion<TRegion = Region> = CodedRegion<TRegion> & {offset?: OffsetRect}
type AccessibilityRegion<TRegion = Region> = CodedRegion<TRegion> & {type?: AccessibilityRegionType}
export interface CheckSettings<TRegion = Region> extends ImageSettings<TRegion> {
  name?: string
  ignoreRegions?: (TRegion | CodedRegion<TRegion>)[]
  layoutRegions?: (TRegion | CodedRegion<TRegion>)[]
  strictRegions?: (TRegion | CodedRegion<TRegion>)[]
  contentRegions?: (TRegion | CodedRegion<TRegion>)[]
  floatingRegions?: (TRegion | FloatingRegion<TRegion>)[]
  accessibilityRegions?: (TRegion | AccessibilityRegion<TRegion>)[]
  accessibilitySettings?: {level?: AccessibilityLevel; version?: AccessibilityGuidelinesVersion}
  matchLevel?: MatchLevel
  useDom?: boolean
  enablePatterns?: boolean
  ignoreCaret?: boolean
  ignoreDisplacements?: boolean
  densityMetrics?: {
    scaleRatio?: number
    xdpi?: number
    ydpi?: number
  }
  domMapping?: Buffer | URL | string
  pageId?: string
  /** @internal */
  stepIndex?: number
  /** @internal */
  renderId?: string
  /** @internal */
  userCommandId?: string
  /** @internal */
  ignoreMismatch?: boolean
  /** @internal */
  ignoreMatch?: boolean
  /** @internal */
  forceMismatch?: boolean
  /** @internal */
  forceMatch?: boolean
}

export interface ReportSettings {
  testMetadata?: Record<string, any>[]
}

export interface CloseSettings extends ReportSettings {
  updateBaselineIfNew?: boolean
  updateBaselineIfDifferent?: boolean
  status?: 'Passed' | 'Failed' | 'Completed'
  /** @internal */
  userCommandId?: string
}

export interface AbortSettings extends ReportSettings {
  /** @internal */
  userCommandId?: string
}

export interface GetResultsSettings {
  /** @internal */
  userCommandId?: string
}

type StepInfo = {
  readonly name: string
  readonly isDifferent: boolean
  readonly hasBaselineImage: boolean
  readonly hasCurrentImage: boolean
  readonly appUrls: AppUrls
  readonly apiUrls: ApiUrls
  readonly renderId: string[]
}
type ApiUrls = {
  readonly baselineImage: string
  readonly currentImage: string
  readonly checkpointImage: string
  readonly checkpointImageThumbnail: string
  readonly diffImage: string
}
type AppUrls = {
  readonly step: string
  readonly stepEditor: string
}
type SessionUrls = {
  readonly batch: string
  readonly session: string
}
export interface TestResult {
  readonly id: string
  readonly baselineId: string
  readonly userTestId: string
  readonly batchId: string
  readonly eyesServer: EyesServerSettings
  readonly secretToken: string
  readonly status: 'Passed' | 'Unresolved' | 'Failed'
  readonly name: string
  readonly appName: string
  readonly batchName: string
  readonly branchName: string
  readonly hostOS: string
  readonly hostApp: string
  readonly hostDisplaySize: Size
  readonly accessibilityStatus: {
    readonly level: AccessibilityLevel
    readonly version: AccessibilityGuidelinesVersion
    readonly status: 'Passed' | 'Failed'
  }
  readonly initializedAt: string
  readonly startedAt: string
  readonly duration: number
  readonly isNew: boolean
  readonly isDifferent: boolean
  readonly isAborted: boolean
  readonly keepIfDuplicate: boolean
  readonly appUrls: SessionUrls
  readonly apiUrls: SessionUrls
  readonly url: string
  readonly stepsInfo: StepInfo[]
  readonly steps: number
  readonly matches: number
  readonly mismatches: number
  readonly missing: number
  readonly exactMatches: number
  readonly strictMatches: number
  readonly contentMatches: number
  readonly layoutMatches: number
  readonly noneMatches: number
}
