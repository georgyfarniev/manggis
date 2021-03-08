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
  onError: OnErrorHook
}

interface IValidationError {
  model: string
  document: string
  path: string
  message: string
}

interface IValidationContext {
  options: IValidationOptions
  connection: Connection
  model?: Model<any>
  doc?: Document
  err?: mongoose.Error.ValidationError
}

async function verifyMongooseConnection(connection: Connection, opts: IValidationOptions) {
  assert(opts.verifyRefs || opts.verifySchema, 'at least one validation option is a must');

  const ctx: IValidationContext = {
    connection,
    options: opts,
  }

  const models = Object.values(connection.models);

  for (const model of models) {
    // Only for refs need to create custom model
    const validationModel = opts.verifyRefs ? createEnhancedModel({ ...ctx, model }) : model;

    // ctx.model = validationModel;

    const count = await validationModel.countDocuments();
    logger.info(`Checking model: ${model.modelName}, documents count: ${count}`);

    const cursor = validationModel.find();
    for await (const doc of cursor) {
      logger.info('    Checking doc: ' + doc._id)
      if (opts.verifySchema) {
        const docCtx = { ...ctx, model: validationModel, doc }
        await verifySchemaForDocument(docCtx);
      }
    }

    if (opts.verifyRefs) {
      mongoose.deleteModel(validationModel.modelName)
    }
  }

  logger.info('all models has been verified');
  process.exit();
}

function createEnhancedModel(ctx: IValidationContext) {
  const schema = ctx.model!.schema.clone();

  const { tempModelNamePrefix, verifyRefs } = ctx.options

  if (verifyRefs) {
    installRefValidator(ctx.connection, schema);
  }

  const name = `${tempModelNamePrefix}${ctx.model!.modelName}`
  return mongoose.model(name, schema, ctx.model!.collection.collectionName);
}

async function verifySchemaForDocument(ctx: IValidationContext) {
  try {
    await ctx.doc!.validate();
  } catch (err) {
    const { onError } = ctx.options;

    if (err instanceof mongoose.Error.ValidationError && onError) {
      await reportValidationErrors({ ...ctx, err });
    } else {
      assert(false, 'Unknown error!');
    }
  }
}

async function reportValidationErrors(ctx: IValidationContext) {
  const { options, doc, err } = ctx;
  const { onError, tempModelNamePrefix } = options;
  const model = ctx.model!.modelName.replace(tempModelNamePrefix, '');

  for (const error of Object.values(err!.errors)) {
    await onError({
      document: doc!._id.toString(),
      model,
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
            const { ref } = type.options;
            const refModel = connection.models[ref];

            assert(refModel, `Referenced model not found: ${ref}`);

            const exists = await refModel.exists({ _id: value });
            return exists;
          },
          message: 'Referenced document not found'
      })
    }
  }
}

// -------------------------------------------------------------------------------------------------

const MG_TEMP_MODEL_PREFIX = '__manggis_model__';

async function main() {
  const { default: loadMongoose } = await import('./_manggisfile_test');
  const connection: Connection = await loadMongoose();

  await verifyMongooseConnection(connection, {
    tempModelNamePrefix: MG_TEMP_MODEL_PREFIX,
    verifyRefs: false,
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
