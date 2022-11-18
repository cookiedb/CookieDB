import { readChunk, readMeta, writeChunk } from "../util/fileOperations.ts";
import { Document } from "../util/types.ts";
import { validateSchema } from "../util/validateSchema.ts";

export function update(
  directory: string,
  tenant: string,
  table: string,
  key: string,
  document: Document,
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.key_index, key)) {
    throw `No such key "${key}"`;
  }
  const [tableName, chunkName] = meta.key_index[key];

  if (tableName !== table) {
    throw `No such key "${key}" in table "${table}"`;
  }

  const schema = meta.table_index[table].schema;

  if (schema) {
    validateSchema(meta, document, schema);
  }

  const chunk = readChunk(directory, tenant, chunkName);
  chunk[key] = document;
  writeChunk(directory, tenant, chunkName, chunk);

  return key;
}
