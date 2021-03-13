import 'jest'
import {  Model, Connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { createEnhancedModel, verifySchemaForDocument } from '../src/validation'
import { IValidationError, IValidationOptions } from '../src/types';
import { createTestDatabase, destroyTestDatabase } from './_db'
import { BAR_ROWS } from './_mock';

const BASE_OPTIONS: IValidationOptions= {
  verifyRefs: true,
  verifySchema: true,
}

async function wrapModel(connection: Connection, model: Model<any>): Promise<Model<any>> {
  const wrappedModel = createEnhancedModel({
    connection,
    model,
    options: BASE_OPTIONS
  });

  return wrappedModel;
}

async function verifyDoc(connection: Connection, model: Model<any>, obj: any) {
  const errors: IValidationError[] = [];

  const options: IValidationOptions = {
    ...BASE_OPTIONS,
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

describe('Low-level validation tests (private API)', () => {
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

    await expect(FooWrapper.countDocuments()).resolves.toBeGreaterThan(0);
  })

  test('test standard mongoose validation error reporting', async () => {
    const errors = await verifyDoc(connection, FooWrapper, {
      name: 'foo1',
      bar: null
    });

    expect(errors).toHaveLength(1);
    const [ error ] = errors;

    expect(error.model).toBe('Foo');
    expect(error.path).toBe('bar');
    expect(error.message).toBe('Path \`bar\` is required.');
  })

  test('test ref validation error reporting', async () => {
    const nonexistingId = new ObjectId();

    const errors = await verifyDoc(connection, FooWrapper, {
      name: 'foo2',
      bar: nonexistingId
    });

    expect(errors).toHaveLength(1);
    const [ error ] = errors;

    expect(error.model).toBe('Foo');
    expect(error.path).toBe('bar');
    expect(error.message).toBe(
      `Referenced document not found: ${nonexistingId}`
    );
  })

  test('test valid ref to existing document', async () => {
    const errors = await verifyDoc(connection, FooWrapper, {
      name: 'foo2',
      bar: BAR_ROWS[0]._id
    });

    expect(errors).toHaveLength(0);
  })

  test('test valid document not requiring ref', async () => {
    const errors = await verifyDoc(connection, BarWrapper, {});
    expect(errors).toHaveLength(1);
    const [ error ] = errors;

    expect(error.model).toBe('Bar');
    expect(error.path).toBe('title');
    expect(error.message).toBe('Path \`title\` is required.');
  });

  test.todo('add more sophisticated test cases');
})

