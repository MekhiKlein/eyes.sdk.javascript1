import type {Awaitable} from '@applitools/utils'
import type {Request, Response, RequestInit, ResponseInit, BodyInit} from './fetch.js'
import type {Stop} from './stop.js'
import type fetch from './fetch.js'

export type Fetch = typeof fetch

export interface Options {
  /**
   * Providing this value will allow usage of relative urls for input
   * @example 'http://localhost:2107/api/'
   */
  baseUrl?: string
  /**
   * Uppercase method name. This will override method provided in `Request` object
   * @example 'GET'
   */
  method?: string
  /**
   * Query parameters to add to the url, all undefined params won't be added.
   * It won't override the whole `search` part of the url, but instead merge with it
   * @example {string: 'value', number: 21, boolean: true, noop: undefined}
   */
  query?: Record<string, string | boolean | number | undefined>
  /**
   * Headers to send in the request, all undefined headers won't be sent.
   * This will merge with headers provided in `Request` object
   * @example {'x-my-header': 'value', 'x-noop-header': undefined}
   */
  headers?: Record<string, string | string[] | undefined>
  /**
   * Body of the request, plain objects will be transformed to JSON strings
   * @example {data: true}
   * @example Buffer.from('S3lyeWxv', 'base64')
   */
  body?: NodeJS.ReadableStream | ArrayBufferView | string | Record<string, any> | any[] | null
  /**
   * Proxy settings for the request. Auth credentials specified in the object will override ones specified in url
   * @example {url: 'http://localhost:2107', username: 'kyrylo', password: 'pass'}
   */
  proxy?: Proxy | ((url: URL) => Proxy | undefined)
  /**
   * Whether to apply dns caching for the request
   */
  useDnsCache?: boolean
  /**
   * Total timeout to wait across all requests before aborting the connection (in ms)
   * @example 90000
   */
  connectionTimeout?: number
  /**
   * Timeout to wait on a single request before aborting and retrying it (in ms)
   * @example 30000
   */
  requestTimeout?: number
  /**
   * Retry settings for the request. If specified as an array the retries are applied in the order
   * @see Retry
   * @example {limit: 5, statuses: [500, 501], codes: ['ECONRESET'], timeout: 1000}
   */
  retry?: Retry | Retry[]
  /**
   * Hooks of the request
   * @see Hooks
   */
  hooks?: Hooks<this> | Hooks<this>[]
  signal?: AbortSignal
  fetch?: Fetch
  /**
   * Fallbacks of the request
   * @see Fallback
   */
  fallbacks?: Fallback<this> | Fallback<this>[]
  /**
   * keepAliveOptions option for the request httpAgent
   * @example {keepAlive: true, keepAliveMsecs: 1000}
   * @example {keepAlive: false}
   * @example {keepAlive: false, keepAliveMsecs: 0}
   */
  keepAliveOptions?: KeepAliveOptions
}

export interface Retry {
  /**
   * Max number of attempts for specified condition
   */
  limit?: number
  /**
   * Timeout before retrying the request. If specified as an array each element specifies the timeout for specific attempt,
   * and the last one will be default for all next attempts
   * @example [1000, 1000, 5000, 10_000]
   */
  timeout?: number | number[]
  /**
   * Validation logic of the request outcome to retry on.
   * @example ({response, error}) => error || response.status >= 400
   */
  validate?: (options: {response?: Response; error?: Error}) => boolean | Promise<boolean>
  /**
   * Status codes of the response to retry on.
   * @example [500]
   */
  statuses?: number[]
  /**
   * Error codes of the request to retry on.
   * @example ['ECONRESET']
   */
  codes?: string[]
  /**
   * Number of the current attempt for specified condition
   * @internal
   */
  attempt?: number
}

export interface Proxy {
  url: string
  username?: string
  password?: string
}

export interface KeepAliveOptions {
  keepAlive: boolean
  keepAliveMsecs?: number
}

export interface Fallback<TOptions extends Options = Options> {
  /**
   * Validation logic of the request outcome to fallback on.
   * @example ({request, error}) => error || request.status >= 400
   */
  shouldFallbackCondition: (options: {response: Response; request: Request}) => Awaitable<boolean>
  /**
   * Update request before fallback
   * @example
   * ```
   * {
   *   updateRequest({options}) {
   *     options.headers = { ...options.headers, 'x-my-header': 'value' }
   *     return request
   *   }
   *}
   *  ```
   **/
  updateOptions?: (options: {options: TOptions}) => Awaitable<TOptions>
  cache?: Map<string, boolean>
}

export interface Hooks<TOptions extends Options = Options> {
  /**
   * Hook that will be executed after options are merged, it will not be executed if no merge takes place
   * @example
   * ```
   * {
   *   afterOptionsMerged({options}) {
   *      options.timeout = 0
   *   }
   * }
   * ```
   */
  afterOptionsMerged?(options: {options: TOptions}): TOptions | void
  /**
   * Hook that will be executed before sending the request, after all, modifications of the `Request` object are already passed
   * @example
   * ```
   * {
   *   beforeRequest({request}) {
   *      request.headers.set('Expires', 'Tue, 24 Aug 2022 00:00:00 GMT')
   *   }
   * }
   * ```
   */
  beforeRequest?(options: {
    request: Request
    options?: TOptions
  }): Awaitable<
    Request | (RequestInit & {request: Request}) | (RequestInit & {url: string | URL; request?: Request}) | void
  >
  /**
   * Hook that will be executed before retrying the request. If this hook will return {@link stop}
   * it will prevent request from retrying and execution of other hooks
   * @example
   * ```
   * {
   *   async beforeRetry({request, response, stop, attempt}) {
   *      const data = await response?.json()
   *      if (data.error) return stop
   *      request.headers.set('x-attempt', attempt)
   *   }
   * }
   * ```
   */
  beforeRetry?(options: {
    request: Request
    attempt: number
    stop: Stop
    response?: Response
    error?: Error
    options?: TOptions
  }): Awaitable<
    Request | (RequestInit & {request: Request}) | (RequestInit & {url: string | URL; request?: Request}) | void | Stop
  >
  /**
   * Hook that will be executed after getting the final response of the request (after all of the retries)
   * @example
   * ```
   * {
   *   async afterResponse({request, response, options}) {
   *      if (!response.ok) return req(request, options)
   *   }
   * }
   * ```
   */
  afterResponse?(options: {
    request: Request
    response: Response
    options?: TOptions
  }): Awaitable<Response | (ResponseInit & {response?: Response; body?: BodyInit | null}) | void>
  /**
   * Hook that will be executed after request will throw an error
   * @example
   * ```
   * {
   *   async afterError({request, error}) {
   *      error.request = request
   *   }
   * }
   * ```
   */
  afterError?(options: {request: Request; error: Error; options?: TOptions}): Awaitable<Error | void>
}

export type AbortSignal = {
  readonly aborted: boolean
  onabort: null | ((event: any) => void)
  addEventListener: (type: 'abort', listener: (this: AbortSignal) => void) => void
  removeEventListener: (type: 'abort', listener: (this: AbortSignal) => void) => void
}
