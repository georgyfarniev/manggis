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

    await validate(connection, {
      onError(err) { errors.push(err); },
      verifyRefs: true,
      verifySchema: true
    });

    expect(errors).toHaveLength(2);
    // TODO: better test for actual error data
  })

})
