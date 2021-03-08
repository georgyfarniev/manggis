
import { Connection } from 'mongoose';
import { validate } from '.'

const MG_TEMP_MODEL_PREFIX = '__manggis_model__';

async function main() {
  const { default: loadMongoose } = await import('./_manggisfile_test');
  const connection: Connection = await loadMongoose();

  await validate(connection, {
    tempModelNamePrefix: MG_TEMP_MODEL_PREFIX,
    verifyRefs: true,
    verifySchema: true,
    onError: ({ model, path, message}) => {
      console.log(`    error [${model}.${path}]: ${message}`)
    },
    onModel(model) {
      console.log('validating model:', model.modelName);
    },
    onDocument(doc) {
      console.log('  validating document:', doc._id);
    }
  });

  console.log('all models has been verified');
  process.exit();
}

if (require.main === module) {
  main()
}
