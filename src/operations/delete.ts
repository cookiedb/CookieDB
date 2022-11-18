import {
  deleteChunk,
  readChunk,
  readMeta,
  writeChunk,
  writeMeta,
} from "../util/fileOperations.ts";

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

  // Delete key from indexes
  delete meta.key_index[key];
  delete meta.chunk_index[chunkName].keys[key];
  delete meta.table_index[table].keys[key];

  // Delete document from chunk
  const chunk = readChunk(directory, tenant, chunkName);
  delete chunk[key];
  writeChunk(directory, tenant, chunkName, chunk);

  // Delete chunk if empty
  if (Object.keys(meta.chunk_index[chunkName].keys).length === 0) {
    delete meta.chunk_index[chunkName];
    deleteChunk(directory, tenant, chunkName);
  }

  writeMeta(directory, tenant, meta);

  return key;
}
