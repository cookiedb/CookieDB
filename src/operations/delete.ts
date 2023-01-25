import {
  deleteChunk,
  readChunk,
  readMeta,
  writeChunk,
  writeMeta,
} from "../util/fileOperations.ts";
import { unindexDocument } from "../util/indexDocument.ts";
import { Chunk } from "../util/types.ts";
import { select } from "./select.ts";

/**
 * Delete a document by key from a table.
 */
export function deleteByKey(
  directory: string,
  tenant: string,
  table: string,
  key: string,
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.key_index, key)) {
    throw `No such key "${key}"`;
  }
  const chunkName = meta.key_index[key];
  const tableName = meta.chunk_index[chunkName];

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
    delete meta.chunk_index[chunkName];
  } else {
    writeChunk(directory, tenant, chunkName, chunk);
  }

  writeMeta(directory, tenant, meta);

  return key;
}

/**
 * Delete documents by query from a table.
 */
export function deleteByQuery(
  directory: string,
  tenant: string,
  table: string,
  where: string,
) {
  // Get documents using a basic select, ideally we would seperate this but eh
  const documents = select(directory, tenant, table, {
    where,
    maxResults: -1,
    expandKeys: false,
  });

  const meta = readMeta(directory, tenant);
  const schema = meta.table_index[table].schema;
  const chunks: Record<string, Chunk> = {};

  for (const document of documents) {
    const key = document.key as string;
    const chunkName = meta.key_index[key];

    // Delete key from key_index
    delete meta.key_index[key];

    if (!(chunkName in chunks)) {
      chunks[chunkName] = readChunk(directory, tenant, chunkName);
    }

    // Unindex document
    if (schema) {
      unindexDocument(chunks[chunkName][key], schema, meta, table);
    }

    delete chunks[chunkName][key];
  }

  for (const [chunkName, chunk] of Object.entries(chunks)) {
    // Delete chunk if empty, otherwise just update it
    if (Object.keys(chunk).length === 0) {
      deleteChunk(directory, tenant, chunkName);

      const index = meta.table_index[table].chunks.indexOf(chunkName);
      meta.table_index[table].chunks.splice(index, 1);
      delete meta.chunk_index[chunkName];
    } else {
      writeChunk(directory, tenant, chunkName, chunk);
    }
  }

  writeMeta(directory, tenant, meta);

  return documents.map((doc) => doc.key);
}
