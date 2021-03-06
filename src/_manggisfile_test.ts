import  { createTestDatabase } from './db'

// DB loading adapter stub!
export default async function getMongooseInstance() {
  return await createTestDatabase();
}