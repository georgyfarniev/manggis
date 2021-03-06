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
    logger.info('Checking model: ' + model.modelName)

    const cursor = model.find();
    for await (const doc of cursor) {
      logger.info('    Checking doc: ' + doc._id)
      if (opts.verifySchema) {
        await verifySchemaForDocument(doc);
      }

      if (opts.verifyRefs) {
        await verifyRefsForDocument(model, doc);
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

async function verifyRefsForDocument(model: Model<any>, doc: Document, ) {
}

async function main() {
  const { default: loadMongoose } = await import('./_manggisfile');
  const connection: Connection = await loadMongoose();
  await verifyMongooseConnection(connection, {
    verifyRefs: true,
    verifySchema: true
  });
}

if (require.main === module) {
  main()
}
