import {type Proxy} from '@applitools/req'
import {type Batch, type FunctionalSession} from '@applitools/core-base'
import {type TunnelClientSettings, type Tunnel} from '@applitools/tunnel-client'

export interface ECClient {
  readonly url: string
  readonly port: number
  unref(): void
  close(): void
}

export interface ECClientSettings {
  serverUrl: string
  proxy?: Proxy
  useDnsCache?: boolean
  options?: ECCapabilitiesOptions
  port?: number
  /** @internal */
  tunnel?: TunnelManagerSettings
}

export interface ECCapabilitiesOptions {
  eyesServerUrl?: string
  apiKey?: string
  region?: 'us-west' | 'australia'
  sessionName?: string
  appName?: string
  testName?: string
  batch?: Batch
  useSelfHealing?: boolean
  tunnel?: boolean
  timeout?: number
  inactivityTimeout?: number
  requestDriverTimeout?: number
  selfHealingMaxRetryTime?: number
}

export interface ECSession {
  serverUrl: string
  proxy?: Proxy
  sessionId: string
  credentials: {eyesServerUrl: string; apiKey: string}
  capabilities: Record<string, any>
  options: ECCapabilitiesOptions
  tunnels?: Tunnel[]
  metadata?: any[]
  tests?: {
    current?: FunctionalSession
    ended?: FunctionalSession[]
  }
}

export type TunnelManagerSettings = TunnelClientSettings & {
  groupSize?: number
  pool?: {
    maxInuse?: number
    timeout?: {idle?: number; expiration?: number}
  }
}
