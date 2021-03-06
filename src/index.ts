import { Mongoose, Model } from 'mongoose';

async function main() {
  /**
   * 1. Load schema object
   * 2. Validate all documents in collection with schema
   * 3. Populate all required refs and ensure their integrity. Allow option to validate all refs, 
   *    not only required ones.
   * 4. Create convenient report on per-collection basis
   */

  // const mongoose = await getMongooseInstance();
  const { default: loadMongoose } = await import('./_manggisfile');

  const mongoose: Mongoose = await loadMongoose();
  const models = Object.values(mongoose.models);

  // console.dir(Object.keys(mongoose.models))

  // Checking schema integrity
  for (const model of models) {
    await verifyModel(model);
  }

  console.log('all models has been verified');
  process.exit();
}

async function verifyModel(model: Model<any>) {
  console.log('verifying model:', model.modelName)
  const cursor = model.find();

  for await (const doc of cursor) {
    // Verify schema
    await doc.validate()

    // Verify ref integrity

    // 1) Find refs in schema obj 2) Populate this refs 3) Verify that refs are populated
    // model.schema.obj
  }
}

if (require.main === module) {
  main()
}
