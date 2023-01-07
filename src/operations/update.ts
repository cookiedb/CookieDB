import { deepmerge } from "../../deps.ts";
import { readChunk, readMeta, writeChunk } from "../util/fileOperations.ts";
import {
  indexDocument,
  unindexDocument,
  verifyDocument,
} from "../util/indexDocument.ts";
import { Document } from "../util/types.ts";
import { validateDocumentWithSchema } from "../util/validateSchema.ts";

/**
 * Update a document with another document by id
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

  const chunk = readChunk(directory, tenant, chunkName);
  const oldDocument = chunk[key];
  const newDocument = deepmerge(oldDocument, document);

  if (schema) {
    // Verify that this is a valid document after merge
    validateDocumentWithSchema(meta, newDocument, schema);
    verifyDocument(newDocument, schema, meta, table, key);

    // Rebuild indexes
    unindexDocument(oldDocument, schema, meta, table);
    indexDocument(newDocument, schema, meta, table, key);
  }
  chunk[key] = newDocument;
  writeChunk(directory, tenant, chunkName, chunk);

  return key;
}
