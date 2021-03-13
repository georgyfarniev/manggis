import 'jest'
import { Document, Model, Connection } from 'mongoose'
import { createEnhancedModel } from '../src/'
import { createTestDatabase, destroyTestDatabase } from './_db'

// async function collectErrors(model: Model<any>, doc: Document): IValidationError[] {
//   const wrappedModel = createEnhancedModel({  });

// }

describe('Refs validation', () => {
  let connection: Connection

  beforeAll(async () => {
    connection = await createTestDatabase();
  })

  afterAll(async () => {
    await destroyTestDatabase();
  });

  test('basic ref errors validation', async () => {
    expect(true).toBeTruthy()
    await expect(connection.models.Foo.count()).resolves.toBeGreaterThan(0);
  })

})

