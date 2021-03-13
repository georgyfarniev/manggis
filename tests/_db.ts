import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Foo, Bar } from './_models';
import { BAR_ROWS, FOO_ROWS } from './_mock';

const mongod = new MongoMemoryServer();

export async function createTestDatabase() {
  const DB_URL = await mongod.getUri();

  console.log('connecting db');
  await mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('connected db');

  await Bar.create(BAR_ROWS, [])

  // using driver because inserted test data will not pass mongoose validation
  await Foo.collection.insertMany(FOO_ROWS);

  console.log('test data created');
  return mongoose.connection;
}

export async function destroyTestDatabase() {
  await mongoose.disconnect();
  await mongod.stop();
}
