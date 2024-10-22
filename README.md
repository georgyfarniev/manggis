# manggis
Mongoose schema and ref integrity validator


<a href="https://www.npmjs.com/package/manggis" alt="Downloads">
  <img src="https://img.shields.io/npm/dm/manggis" />
</a>

<a href="https://www.npmjs.com/package/manggis">
  <img src="https://img.shields.io/npm/v/manggis" />
</a>

**Motivation: create simple tool to validate mongoose schema and references integrity**


How it works:
It takes a mongoose connection instance from your code and interate thru each model and each
document using async iterable interface provided by mongoose. Due to limitations of mongoose api,
it will create custom model clone if verifyRefs option set to true to avoid mutating original model.
This models will be automatically deleted later.

Additional features:

- No external dependencies except mongoose as a peer dependency
- Simple programmatic API allowing you to create any logging or data processing
- Typescript typings

### Installation

```bash
npm i -S manggis
```
### Example (Typescript)

```ts
import { Connection } from 'mongoose';
import { validate } from 'manggis'

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

```

### Contributions

Feel free to send PR's or suggest new features in Issues.
