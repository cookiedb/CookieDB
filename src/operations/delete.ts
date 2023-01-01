import {
  deleteChunk,
  readChunk,
  readMeta,
  writeChunk,
  writeMeta,
} from "../util/fileOperations.ts";
import { unindexDocument } from "../util/indexDocument.ts";

export function del(
  directory: string,
  tenant: string,
  table: string,
  key: string,
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.key_index, key)) {
    throw `No such key "${key}"`;
  }
  const [tableName, chunkName] = meta.key_index[key];

  if (tableName !== table) {
    throw `No such key "${key}" in table "${table}"`;
  }

  // Delete key from key_index
  delete meta.key_index[key];

  // Delete document from chunk
  const chunk = readChunk(directory, tenant, chunkName);

  // Unindex document
  const schema = meta.table_index[table].schema;
  if (schema) {
    unindexDocument(chunk[key], schema, meta, table);
  }

  delete chunk[key];

  // Delete chunk if empty, otherwise just update it
  if (Object.keys(chunk).length === 0) {
    deleteChunk(directory, tenant, chunkName);

    const index = meta.table_index[table].chunks.indexOf(chunkName);
    meta.table_index[table].chunks.splice(index, 1);
  } else {
    writeChunk(directory, tenant, chunkName, chunk);
  }

  writeMeta(directory, tenant, meta);

  return key;
}
