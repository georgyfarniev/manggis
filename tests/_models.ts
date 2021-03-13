import mongoose, { Schema } from 'mongoose';

const DeepNestedSchema: Schema = new Schema({
  param: { type: Number, required: true },
});

const NestedSchema: Schema = new Schema({
  field: { type: Number, required: true },
  bar: { type: Schema.Types.ObjectId, ref: 'Bar', required: true },
  subsubdoc: DeepNestedSchema
});

// TODO: even more complex scenarios, such as deeply nested arrays of subdocuments
const FooSchema: Schema = new Schema({
  name: { type: String, required: true },
  bar: { type: Schema.Types.ObjectId, ref: 'Bar', required: true },
  barOptional: { type: Schema.Types.ObjectId, ref: 'Bar', required: false },
  subdoc: NestedSchema,
  subarray: [NestedSchema],
  refarray: [{ type: Schema.Types.ObjectId, ref: 'Bar', required: true }]
});

const BarSchema: Schema = new Schema({
  title: { type: String, required: true }
});

export const Foo = mongoose.model('Foo', FooSchema);
export const Bar = mongoose.model('Bar', BarSchema);
