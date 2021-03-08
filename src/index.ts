import assert from 'assert';
import mongoose, { Connection, Schema } from 'mongoose';
import type { IValidationContext, IValidationOptions } from './types';

/**
 * TODO list:
 * 1. Optionally allow to specify query filters (by exposing lower level api)
 * 2. Allow custom reporting api (via callbacks or async iterables)
 * 3. Unit tests
 * 4. Advertise it in blogs or social networks
 * 5. Statistics
 */

export async function verifyMongooseConnection(connection: Connection, opts: IValidationOptions) {
  assert(opts.verifyRefs || opts.verifySchema, 'at least one validation option is a must');

  const ctx: IValidationContext = {
    connection,
    options: opts,
  }

  const models = Object.values(connection.models);

  for (const model of models) {
    // Only for refs need to create custom model
    const validationModel = opts.verifyRefs ? createEnhancedModel({ ...ctx, model }) : model;

    if (opts.onModel) await opts.onModel(model);

    const cursor = validationModel.find();
    for await (const doc of cursor) {
      if (opts.onDocument) await opts.onDocument(doc);

      if (opts.verifySchema) {
        const docCtx = { ...ctx, model: validationModel, doc }
        await verifySchemaForDocument(docCtx);
      }
    }

    if (opts.verifyRefs) {
      mongoose.deleteModel(validationModel.modelName)
    }
  }
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
