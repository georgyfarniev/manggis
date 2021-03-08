import { Connection, Document, Model, Error } from 'mongoose';

export type OnErrorHook = (ctx: IValidationError) => Promise<void>

// Validator execution context
// TODO: add defaults
export interface IValidationOptions {
  tempModelNamePrefix: string
  verifySchema: boolean
  verifyRefs: boolean
  onError: OnErrorHook
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
