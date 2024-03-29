import {
  deleteChunk,
  readChunk,
  readMeta,
  writeMeta,
} from "../util/fileOperations.ts";

/**
 * Removes a table and updates the index
 */
export function drop(directory: string, tenant: string, table: string) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.table_index, table)) {
    throw `No table with name "${table}" to drop`;
  }

  for (const chunkName of meta.table_index[table].chunks) {
    const chunk = readChunk(directory, tenant, chunkName);

    // Delete keys from key_index
    for (const key of Object.keys(chunk)) {
      delete meta.key_index[key];
    }

    // Delete chunk from index
    delete meta.chunk_index[chunkName];

    // Delete actual chunk file
    deleteChunk(directory, tenant, chunkName);
  }

  // Delete table in table_index
  delete meta.table_index[table];
  writeMeta(directory, tenant, meta);
}
