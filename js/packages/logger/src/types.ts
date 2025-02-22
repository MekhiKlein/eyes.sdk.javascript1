import type {LogLevel} from './log-level'
import type {formatter} from './formatter'

export interface Logger extends Printer {
  readonly isLogger: true
  readonly options: Readonly<LoggerOptions>
  readonly console: Printer
  extend(
    loggerOrOptions?:
      | Logger
      | (Omit<FormatOptions, 'level'> & {level?: LogLevelName | number; console?: boolean | Handler}),
    options?: Omit<FormatOptions, 'level'> & {level?: LogLevelName | number; console?: boolean | Handler},
  ): Logger
  colorize(string: string, options?: {color?: Style | Style[]}): string
  open(): void
  close(): void
}

export type LoggerOptions = Omit<Partial<PrinterOptions>, 'handler' | 'level'> & {
  logger?: Logger
  handler?: ConsoleHandler | FileHandler | RollingFileHandler | DebugHandler | Handler
  console?: boolean | Handler
  level?: LogLevelName | number
}

export interface Printer {
  debug(...messages: any[]): void
  log(...messages: any[]): void
  info(...messages: any[]): void
  warn(...messages: any[]): void
  error(...messages: any[]): void
  fatal(...messages: any[]): void
  /** @deprecated */
  verbose(...messages: any[]): void
}

export type PrinterOptions = {
  handler: Handler
  level: number
  format?: Omit<FormatOptions, 'level'> & {formatter?: typeof formatter}
}

export type ConsoleHandler = {type: 'console'}

export type DebugHandler = {type: 'debug'; label?: string}

export type FileHandler = {type: 'file'; filename?: string; append?: boolean}

export type RollingFileHandler = {
  type: 'rolling file'
  dirname?: string
  name?: string
  maxFileLength?: number
  maxFileNumber?: number
}

export interface Handler {
  log(message: any): void
  warn?(message: any): void
  error?(message: any): void
  fatal?(message: any): void
  open?(): void
  close?(): void
}

export type LogLevelName = keyof typeof LogLevel

type Color =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'grey'
  | 'blackBright'
  | 'redBright'
  | 'greenBright'
  | 'yellowBright'
  | 'blueBright'
  | 'magentaBright'
  | 'cyanBright'
  | 'whiteBright'
type BGColor = `bg${Capitalize<Color>}`

export type Style = Color | BGColor

export type ColoringOptions = {
  timestamp?: Style | Style[]
  level?: {[key in LogLevelName]?: Style | Style[]}
  label?: Style | Style[]
  tags?: Style | Style[]
  message?: Style | Style[]
}

export type FormatOptions = {
  prelude?: boolean
  label?: string
  timestamp?: Date | boolean
  level?: LogLevelName
  tags?: string[] | string[][]
  colors?: ColoringOptions | boolean
}
