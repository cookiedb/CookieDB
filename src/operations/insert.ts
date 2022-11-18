import {
  readChunk,
  readMeta,
  writeChunk,
  writeMeta,
} from "../util/fileOperations.ts";
import { Document } from "../util/types.ts";
import { validateSchema } from "../util/validateSchema.ts";

interface InsertOpts {
  maxDocumentsPerChunk: number;
}

export function insert(
  directory: string,
  tenant: string,
  table: string,
  document: Document,
  opts: InsertOpts,
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.table_index, table)) {
    throw `No table with name "${table}" to insert into`;
  }
  const schema = meta.table_index[table].schema;

  if (schema) {
    validateSchema(meta, document, schema);
  }

  const key = crypto.randomUUID();
  let chunkName: string | null = null;

  // Check if there are any valid chunks just chilling
  for (
    const [potentialChunkName, chunkMeta] of Object.entries(meta.chunk_index)
  ) {
    if (Object.keys(chunkMeta.keys).length < opts.maxDocumentsPerChunk) {
      chunkName = potentialChunkName;
      break;
    }
  }
  // If there are not make a new chunk and put document in that chunk
  if (chunkName === null) {
    chunkName = crypto.randomUUID();
    meta.chunk_index[chunkName] = {
      keys: {},
    };
    writeChunk(directory, tenant, chunkName, {});
  }

  meta.chunk_index[chunkName].keys[key] = table;
  meta.key_index[key] = [table, chunkName];
  meta.table_index[table].keys[key] = chunkName;

  writeMeta(directory, tenant, meta);

  const chunk = readChunk(directory, tenant, chunkName);
  chunk[key] = document;
  writeChunk(directory, tenant, chunkName, chunk);

  return key;
}

export function bulkInsert(
  directory: string,
  tenant: string,
  table: string,
  documents: Document[],
  opts: InsertOpts,
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.table_index, table)) {
    throw `No table with name "${table}" to insert into`;
  }
  const schema = meta.table_index[table].schema;
  const keys = [];

  // TODO: Optimize this a lot
  for (const document of documents) {
    if (schema) {
      validateSchema(meta, document, schema);
    }

    const key = crypto.randomUUID();
    let chunkName: string | null = null;

    // Check if there are any valid chunks just chilling
    for (
      const [potentialChunkName, chunkMeta] of Object.entries(meta.chunk_index)
    ) {
      if (Object.keys(chunkMeta.keys).length < opts.maxDocumentsPerChunk) {
        chunkName = potentialChunkName;
        break;
      }
    }
    // If there are not make a new chunk and put document in that chunk
    if (chunkName === null) {
      chunkName = crypto.randomUUID();
      meta.chunk_index[chunkName] = {
        keys: {},
      };
      writeChunk(directory, tenant, chunkName, {});
    }

    meta.chunk_index[chunkName].keys[key] = table;
    meta.key_index[key] = [table, chunkName];
    meta.table_index[table].keys[key] = chunkName;

    writeMeta(directory, tenant, meta);

    const chunk = readChunk(directory, tenant, chunkName);
    chunk[key] = document;
    writeChunk(directory, tenant, chunkName, chunk);

    keys.push(key);
  }

  return keys;
}
