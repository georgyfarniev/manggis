
import { Connection } from 'mongoose';
import { validate } from '.'

async function main() {
  /* !!! place your mongoose connection instance here !!! */
  const connection: Connection = {} as Connection

  await validate(connection, {
    onError: ({ model, path, message }) => {
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
