export interface PrepareTunnelEnvironmentSettings {
  tunnelServerUrl?: string
  cacheDir?: string
}

export interface TunnelClientSettings {
  tunnelServerUrl?: string
  serviceUrl?: string
}

export interface TunnelClientWorkerSettings extends TunnelClientSettings {
  pollingServerUrl: string
  secret: string
  agentId: string
  pollingTimeout?: number
  timeout?: number
  envInfo?: Record<string, any>
}

export interface TunnelClient {
  list(): Promise<Tunnel[]>
  create(credentials: TunnelCredentials): Promise<Tunnel>
  replace(tunnelId: string): Promise<Tunnel>
  destroy(tunnelId: string): Promise<void>
  close(): Promise<void>
}

export interface TunnelCredentials {
  eyesServerUrl: string
  tunnelServerUrl?: string
  apiKey: string
}

export interface Tunnel {
  tunnelId: string
  credentials: TunnelCredentials
}
