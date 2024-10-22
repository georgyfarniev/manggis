import { Connection, Document, Model, Error } from 'mongoose';

export type OnErrorHook = (ctx: IValidationError) => Promise<void>|void
export type OnModelHook = (model: Model<any>) => Promise<void>|void
export type OnDocumentHook = (doc: Document) => Promise<void>|void


// Validator execution context
// TODO: add defaults
export interface IValidationOptions {
  tempModelNamePrefix?: string

  // TODO: schema always will be verified, only turn on or off refs validation!
  verifySchema?: boolean
  verifyRefs?: boolean

  // Fired once error received (per-field basis)
  onError?: OnErrorHook

  // Fired once model processing started
  onModel?: OnModelHook

  // Fired once document processing started
  onDocument?: OnDocumentHook
}

export interface IValidationError {
  model: string
  document: string
  path: string
  message: string
}

export interface IValidationContext {
  options: IValidationOptions
  connection: Connection
  model?: Model<any>
  doc?: Document
  err?: Error.ValidationError
}
