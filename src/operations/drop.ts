import {
  deleteChunk,
  readChunk,
  readMeta,
  writeMeta,
} from "../util/fileOperations.ts";

export function drop(directory: string, tenant: string, table: string) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.table_index, table)) {
    throw `No table with name "${table}" to drop`;
  }
  const tableMeta = meta.table_index[table];

  // TODO: Optimize dropping chunks

  // Delete keys from key_index and chunk_index
  for (const [key, chunkName] of Object.entries(tableMeta.keys)) {
    delete meta.key_index[key];
    delete meta.chunk_index[chunkName].keys[key];

    const chunk = readChunk(directory, tenant, chunkName);
    delete chunk[key];

    // Delete chunk if empty
    if (Object.keys(meta.chunk_index[chunkName].keys).length === 0) {
      delete meta.chunk_index[chunkName];
      deleteChunk(directory, tenant, chunkName);
    }
  }

  // Delete table in table_index
  delete meta.table_index[table];
  writeMeta(directory, tenant, meta);
}
