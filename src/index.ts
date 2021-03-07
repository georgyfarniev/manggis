import assert from 'assert';
import { Model, Connection, Document, Schema, SchemaType } from 'mongoose';

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

  // console.dir( model.schema.paths.refarray.constructor.name)
  // process.exit(0)

  for (const key of keys) {
    const type = model.schema.paths[key] as any;


    const schemaType = type.constructor.name;

    if (schemaType === 'SingleNestedPath') {} // nested subdocument
    else if (schemaType === 'DocumentArrayPath') {} // nested subdocument array
    else if (schemaType === 'SchemaArray') {} // arrays if objectid's
    // console.dir(type)
    // break;
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

interface ITraverseContext {
  doc: Document
  schema: Schema
  isArray: boolean
  path: string
}

// Traversing schema to find and validate each ref
// async function traverseSchema(schema: Schema, path: string = '') {
async function traverseSchema(ctx: ITraverseContext) {
  const applyPath = (key: string) => ctx.path ? `${ctx.path}.${key}` : key

  // paths are not fully typed yet!
  const entries: any = Object.entries(ctx.schema.paths);
  for (const [key, type] of entries) {

    const ctor = type.constructor.name;

    if ('SingleNestedPath' === ctor) {
      // nested subdocument
      // await traverseSchema(type.schema, applyPath(key))
      await traverseSchema({
        schema: type.schema,
        isArray: false,
        doc: ctx.doc,
        path: applyPath(key)
      })
    } else if ('DocumentArrayPath' === ctor) {
      const kPath = applyPath(key);
      console.log('\t', kPath)
      await traverseSchema({
        schema: type.schema,
        isArray: true,
        doc: ctx.doc,
        path: kPath
      })

      // nested subdocument array
      // await traverseSchema(type.schema, kPath)
    } else {
      if (type.options.ref)
        console.log('leaf:', applyPath(key))
    }
  }
}

async function traverseSubdocumentSchema(doc: SchemaType) {
  
}

async function main() {
  const { default: loadMongoose } = await import('./_manggisfile_test');
  const connection: Connection = await loadMongoose();

  const doc = connection.models.Foo.findOne({ name: 'foo1' });

  await traverseSchema({
    schema: connection.models.Foo.schema,
    doc,
    isArray: false,
    path: ''
  });

  // await verifyMongooseConnection(connection, {
  //   verifyRefs: true,
  //   verifySchema: true
  // });

  process.exit()
}

if (require.main === module) {
  main()
}
