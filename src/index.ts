import assert from 'assert';
import mongoose, { Connection, Document, Model, Schema } from 'mongoose';

/**
 * TODO list:
 * 1. Optionally allow to specify query filters (by exposing lower level api)
 * 2. Allow custom reporting api (via callbacks or async iterables)
 * 3. Unit tests
 * 4. Advertise it in blogs or social networks
 */

// logger stub
const logger = {
  info(msg: string) {
    console.log(msg)
  },
  error(msg: string) {
    console.error(msg);
  }
}

type OnErrorHook = (ctx: IValidationError) => Promise<void>

// Validator execution context
// TODO: add defaults
interface IValidationOptions {
  tempModelNamePrefix: string
  verifySchema: boolean
  verifyRefs: boolean
  onError?: OnErrorHook
}

interface IValidationError {
  model: string
  document: string
  path: string
  message: string
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
        await verifySchemaForDocument(doc, opts);
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

  const name = `${opts.tempModelNamePrefix}${model.modelName}`
  return mongoose.model(name, schema, model.collection.collectionName);
}

async function verifySchemaForDocument(doc: Document, opts: IValidationOptions) {
  try {
    await doc.validate();
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError && opts.onError) {
      await reportValidationErrors(doc, err, opts.onError);
    } else {
      // fatal error
    }

    // console.log('reason:', err?.errors?.bar?.properties?.message)

    // const errorMessage = err?.message?.replace(MG_TEMP_MODEL_PREFIX, '')
    // logger.error(`validation error for doc with id: ${doc._id}: ${errorMessage}`)
  }
}

async function reportValidationErrors(doc: Document, err: mongoose.Error.ValidationError, cb: OnErrorHook) {
  for (const error of Object.values(err.errors)) {
    await cb({
      document: doc._id.toString(),
      model: doc.modelName,
      path: error.path,
      message: error.message
    })
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

const MG_TEMP_MODEL_PREFIX = '__manggis_model__';

async function main() {
  const { default: loadMongoose } = await import('./_manggisfile_test');
  const connection: Connection = await loadMongoose();

  await verifyMongooseConnection(connection, {
    tempModelNamePrefix: MG_TEMP_MODEL_PREFIX,
    verifyRefs: true,
    verifySchema: true,
    onError: async (ctx) => {
      console.dir(ctx);
    }
  });

  process.exit()
}

if (require.main === module) {
  main()
}
