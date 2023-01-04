import { readChunk, readMeta, writeChunk } from "../util/fileOperations.ts";
import {
  indexDocument,
  unindexDocument,
  verifyDocument,
} from "../util/indexDocument.ts";
import { Document } from "../util/types.ts";
import { validateDocumentWithSchema } from "../util/validateSchema.ts";

/**
 * Replace a document with another document by id
 */
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
    validateDocumentWithSchema(meta, document, schema);
    verifyDocument(document, schema, meta, table, key);
  }

  const chunk = readChunk(directory, tenant, chunkName);

  if (schema) {
    unindexDocument(chunk[key], schema, meta, table);
    indexDocument(document, schema, meta, table, key);
  }
  chunk[key] = document;
  writeChunk(directory, tenant, chunkName, chunk);

  return key;
}
