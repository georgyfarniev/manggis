
import { Connection } from 'mongoose';
import { verifyMongooseConnection } from '.'

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

  console.log('all models has been verified');
  process.exit();
}

if (require.main === module) {
  main()
}
