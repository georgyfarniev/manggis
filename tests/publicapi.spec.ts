import 'jest'
import { Connection } from 'mongoose'
import { IValidationError } from '../src/types';
import { createTestDatabase, destroyTestDatabase } from './_db'
import { validate } from '../src'

describe('High-level public API unit test', () => {
  let connection: Connection

  beforeAll(async () => {
    connection = await createTestDatabase();
  })

  afterAll(async () => {
    await destroyTestDatabase();
  });

  test('test global validation function to check all collections data', async () => {
    const errors: IValidationError[] = [];

    const modelsBefore = Object.keys(connection.models);

    await validate(connection, {
      onError(err) { errors.push(err); },
      verifyRefs: true,
      verifySchema: true
    });

    expect(errors).toHaveLength(2);

    // ensure all cloned models has been removed after validation
    const modelsAfter = Object.keys(connection.models);
    expect(modelsAfter).toStrictEqual(modelsBefore)

    // TODO: better test for actual error data
  })

})
