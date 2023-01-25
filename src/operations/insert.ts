import {
  readChunk,
  readMeta,
  writeChunk,
  writeMeta,
} from "../util/fileOperations.ts";
import { indexDocument, verifyDocument } from "../util/indexDocument.ts";
import { Document, Meta } from "../util/types.ts";
import { validateDocumentWithSchema } from "../util/validateSchema.ts";

interface InsertOpts {
  maxDocumentsPerChunk: number;
}

function getValidChunk(
  directory: string,
  tenant: string,
  table: string,
  meta: Meta,
  maxDocumentsPerChunk: number,
) {
  // Check if there are any valid chunks just chilling
  for (const chunkName of meta.table_index[table].chunks) {
    const chunk = readChunk(directory, tenant, chunkName);
    if (Object.keys(chunk).length < maxDocumentsPerChunk) {
      return chunkName;
    }
  }

  // If there is not, make a new chunk
  const chunkName = crypto.randomUUID();
  meta.table_index[table].chunks.push(chunkName);
  meta.chunk_index[chunkName] = table;
  writeChunk(directory, tenant, chunkName, {});
  return chunkName;
}

/**
 * Insert a singular document into table. Throws if not valid.
 */
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
    validateDocumentWithSchema(meta, document, schema);
    verifyDocument(document, schema, meta, table);
  }

  const key = crypto.randomUUID();
  const chunkName = getValidChunk(
    directory,
    tenant,
    table,
    meta,
    opts.maxDocumentsPerChunk,
  );

  meta.key_index[key] = chunkName;

  if (schema) indexDocument(document, schema, meta, table, key);

  writeMeta(directory, tenant, meta);

  const chunk = readChunk(directory, tenant, chunkName);
  chunk[key] = document;
  writeChunk(directory, tenant, chunkName, chunk);

  return key;
}

/**
 * Inserts bulk group of documents. Throws if not valid.
 */
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

  let chunkName = getValidChunk(
    directory,
    tenant,
    table,
    meta,
    opts.maxDocumentsPerChunk,
  );
  let chunk = readChunk(directory, tenant, chunkName);

  for (const document of documents) {
    if (schema) {
      validateDocumentWithSchema(meta, document, schema);
      verifyDocument(document, schema, meta, table);
    }

    const key = crypto.randomUUID();

    meta.key_index[key] = chunkName;
    chunk[key] = document;

    if (schema) indexDocument(document, schema, meta, table, key);

    // if chunk is full, get a new valid chunk to start writing into
    if (Object.keys(chunk).length >= opts.maxDocumentsPerChunk) {
      writeChunk(directory, tenant, chunkName, chunk);
      chunkName = getValidChunk(
        directory,
        tenant,
        table,
        meta,
        opts.maxDocumentsPerChunk,
      );
      chunk = readChunk(directory, tenant, chunkName);
    }

    keys.push(key);
  }

  writeChunk(directory, tenant, chunkName, chunk);
  writeMeta(directory, tenant, meta);

  return keys;
}
