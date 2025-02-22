export interface Transport<TSocket, TData> {
  onReady(socket: TSocket, callback: () => void): () => void
  onMessage(socket: TSocket, callback: (data: TData) => void): () => void
  onError(socket: TSocket, callback: (reason: any) => void): () => void
  onClose(socket: TSocket, callback: () => void): () => void
  isReady(socket: TSocket): boolean
  send(socket: TSocket, data: TData): void
  serialize?(data: Record<string, any>): TData
  deserialize?(data: TData): Record<string, any>
}
