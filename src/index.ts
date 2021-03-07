import assert from 'assert';
import mongoose, { Connection, Document, Model, Schema } from 'mongoose';

// logger stub
const logger = {
  info(msg: string) {
    console.log(msg)
  },
  error(msg: string) {
    console.error(msg);
  }
}

// Validator execution context
interface IValidationOptions {
  verifySchema: boolean
  verifyRefs: boolean
}

async function verifyMongooseConnection(connection: Connection, opts: IValidationOptions) {
  assert(opts.verifyRefs || opts.verifySchema, 'at least one validation option is a must');

  const models = Object.values(connection.models);

  for (const model of models) {
    // Only for refs need to create custom model
    const validationModel = opts.verifyRefs ? createEnhancedModel(connection, model, opts) : model;

    const count = await validationModel.countDocuments();
    logger.info(`Checking model: ${model.modelName}, documents count: ${count}`);

    const cursor = validationModel.find();
    for await (const doc of cursor) {
      logger.info('    Checking doc: ' + doc._id)
      if (opts.verifySchema) {
        await verifySchemaForDocument(doc);
      }
    }

    mongoose.deleteModel(validationModel.modelName)
  }

  logger.info('all models has been verified');
  process.exit();
}

function createEnhancedModel(connection: Connection, model: Model<any>, opts: IValidationOptions) {
  const schema = model.schema.clone();

  if (opts.verifyRefs) {
    installRefValidator(connection, schema);
  }

  const name = `__manggis_model__${model.modelName}`
  return mongoose.model(name, schema, model.collection.collectionName);
}

async function verifySchemaForDocument( doc: Document) {
  try {
    await doc.validate();
  } catch (err) {
    logger.error(`validation error for doc with id: ${doc._id}: ${err.message}`)
  }
}

function installRefValidator(connection: Connection, schema: Schema) {
  // paths are not fully typed yet!
  for (const type of Object.values<any>(schema.paths)) {
    if (type.schema) {
      installRefValidator(connection, type.schema);
    } else if (type.options.ref) {
      type.validate({
          validator: async (value: any) => {
            const refModel = connection.models[type.options.ref];
            const exists = await refModel.exists({ _id: value });
            return exists;
          },
          message: 'Referenced document not found'
      })
    }
  }
}

async function main() {
  const { default: loadMongoose } = await import('./_manggisfile_test');
  const connection: Connection = await loadMongoose();

  await verifyMongooseConnection(connection, {
    verifyRefs: true,
    verifySchema: true
  });

  process.exit()
}

if (require.main === module) {
  main()
}
