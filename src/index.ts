import assert from 'assert';
import { Model, Connection, Document } from 'mongoose';

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
  /**
   * 1. Load schema object
   * 2. Validate all documents in collection with schema
   * 3. Populate all required refs and ensure their integrity. Allow option to validate all refs, 
   *    not only required ones.
   * 4. Create convenient report on per-collection basis
   */

  assert(opts.verifyRefs || opts.verifySchema, 'at least one validation option is a must');

  const models = Object.values(connection.models);

  for (const model of models) {
    const count = await model.countDocuments();
    logger.info(`Checking model: ${model.modelName}, documents count: ${count}`);

    const cursor = model.find();
    for await (const doc of cursor) {
      logger.info('    Checking doc: ' + doc._id)
      if (opts.verifySchema) {
        await verifySchemaForDocument(doc);
      }

      if (opts.verifyRefs) {
        // pack params to context obj
        await verifyRefsForDocument(connection, model, doc);
      }
    }
  }

  logger.info('all models has been verified');
  process.exit();
}


async function verifySchemaForDocument( doc: Document) {
  try {
    await doc.validate();
  } catch (err) {
    logger.error(`validation error for doc with id: ${doc._id}: ${err.message}`)
  }
}

// TODO: support for nested refs and array refs
async function verifyRefsForDocument(connection: Connection, model: Model<any>, doc: Document) {
  const keys = Object.keys(model.schema.paths);

  for (const key of keys) {
    const type = model.schema.paths[key] as any;
    const options = type.options;

    // ref and required!
    if (options.ref && options.required) {
      const refValue = doc.get(key);

      if (!refValue) {
        logger.error(`\tref ${key} is required, but missing`)
        continue;
      }

      const exists = await connection.models[options.ref].exists({ _id: refValue });
      if (!exists) {
        logger.error(`\tref ${key} is required, but not found`)
      }
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
}

if (require.main === module) {
  main()
}
