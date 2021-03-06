const ENTRYPOINT = '../../../aibolit/packages/common/dist/index.js'

// DB loading adapter stub!
export default async function getMongooseInstance() {
  const importedInstance = await import(ENTRYPOINT);

  const { connect, connection } = importedInstance.DB;

  await connect();

  return connection;
}