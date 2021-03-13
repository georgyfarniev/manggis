import 'jest'
import { Document, Model, Connection } from 'mongoose'
import { createEnhancedModel, verifySchemaForDocument } from '../src/'
import { IValidationContext, IValidationError, IValidationOptions } from '../src/types';
import { createTestDatabase, destroyTestDatabase } from './_db'

async function wrapModel(connection: Connection, model: Model<any>): Promise<Model<any>> {
  const options: IValidationOptions = {
    verifyRefs: true,
    verifySchema: true,
  };

  const wrappedModel = createEnhancedModel({
    connection,
    model,
    options
  });

  return wrappedModel;
}

async function verifyDoc(connection: Connection, model: Model<any>, obj: any) {
  const errors: IValidationError[] = [];

  const options: IValidationOptions = {
    verifyRefs: true,
    verifySchema: true,
    onError(err) { errors.push(err); }
  };

  const doc = new model(obj);

  await verifySchemaForDocument({
    connection,
    model,
    options,
    doc
  });

  return errors;
}

describe('Refs validation', () => {
  let connection: Connection

  let FooWrapper: Model<any>
  let BarWrapper: Model<any>

  beforeAll(async () => {
    connection = await createTestDatabase();
    FooWrapper = await wrapModel(connection, connection.models.Foo);
    BarWrapper = await wrapModel(connection, connection.models.Bar);
  })

  afterAll(async () => {
    await destroyTestDatabase();
  });

  test('db sanity test', async () => {
    expect(FooWrapper).toBeDefined();
    expect(BarWrapper).toBeDefined();

    await expect(FooWrapper.count()).resolves.toBeGreaterThan(0);
  })

  test('advanced test', async () => {

    const errors = await verifyDoc(connection, FooWrapper, {
      name: 'foo3',
      bar: null
    });

    expect(errors).toMatchSnapshot();
  })
})

