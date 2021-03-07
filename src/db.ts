/**
 * Test database with mocks
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb'

const mongod = new MongoMemoryServer();
// const DB_URL = 'mongodb://localhost:27017/manggis_test'

const NestedSchema: Schema = new Schema({
  field: { type: Number, required: true },
  bar: { type: Schema.Types.ObjectId, ref: 'Bar', required: true },
});

const FooSchema: Schema = new Schema({
  name: { type: String, required: true },
  bar: { type: Schema.Types.ObjectId, ref: 'Bar', required: true },
  barOptional: { type: Schema.Types.ObjectId, ref: 'Bar', required: false },
  subdoc: NestedSchema,
  subarray: [NestedSchema],
  refarray: [{ type: Schema.Types.ObjectId, ref: 'Bar', required: true }]
});

const Foo = mongoose.model('Foo', FooSchema);

const BarSchema: Schema = new Schema({
  title: { type: String, required: true }
});

const Bar = mongoose.model('Bar', BarSchema);

export async function createTestDatabase() {
  const DB_URL = await mongod.getUri();

  await mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const [bar1, bar2] = await Bar.create([
    { title: 'bar1' },
    { title: 'bar2' }
  ], [])

  const nonexistingId = new ObjectId();

  await Foo.collection.insertMany([
    // correct
    {
      name: 'foo1',
      bar: bar1._id,
      subdoc: { field: 111, bar: bar2._id },
      subarray: [{ field: 222, bar: bar1._id }],
      refarray:[nonexistingId]
    },

    // corrrect with optional field set as well
    {
      name: 'foo2',
      bar: bar1._id,
      barOptional: bar2._id 
    },

    // incorrect (required, but missing), will trigger validation error
    {
      name: 'foo3',
      bar: null
    },

    // incorrect, broken reference (nonexisting target)
    {
      name: 'foo3',
      bar: nonexistingId
    }
  ]);

  console.log('db connected', DB_URL);
  return mongoose.connection;
}