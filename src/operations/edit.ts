import { recursivelyExpandAlias } from "../util/expandDocument.ts";
import {
  readChunk,
  readMeta,
  writeChunk,
  writeMeta,
} from "../util/fileOperations.ts";
import { verifyDocument } from "../util/indexDocument.ts";
import { Alias, Schema } from "../util/types.ts";
import { validateDocumentWithSchema } from "../util/validateSchema.ts";

/**
 * Edits a table by providing (optionally) a new name, a new schema, and a new alias.
 */
export function edit(
  directory: string,
  tenant: string,
  table: string,
  opts: {
    name?: string;
    schema?: Schema | null;
    alias?: Alias;
  },
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.table_index, table)) {
    throw `Table with name ${table} does not exist`;
  }

  const tableMeta = meta.table_index[table];

  // Get the current schema
  const schema = opts.schema === undefined
    ? tableMeta.schema
    : (opts.schema === null ? null : opts.schema ?? tableMeta.schema);

  if (schema) {
    // Validate that the schema works for all documents
    for (const chunkName of meta.table_index[table].chunks) {
      const chunk = readChunk(directory, tenant, chunkName);
      for (const key of Object.keys(chunk)) {
        const document = opts.alias
          ? recursivelyExpandAlias(opts.alias, chunk[key])
          : chunk[key];
        validateDocumentWithSchema(meta, document, schema);
        verifyDocument(document, schema, meta, table);
      }
    }

    tableMeta.schema = schema;
  }

  if (opts.alias) {
    // Set all documents to their new forms via aliases
    for (const chunkName of meta.table_index[table].chunks) {
      const chunk = readChunk(directory, tenant, chunkName);
      for (const key of Object.keys(chunk)) {
        chunk[key] = recursivelyExpandAlias(opts.alias, chunk[key]);
      }
      writeChunk(directory, tenant, chunkName, chunk);
    }
  }

  if (opts.name) {
    delete meta.table_index[table];
    meta.table_index[opts.name] = tableMeta;

    for (const chunkName of tableMeta.chunks) {
      meta.chunk_index[chunkName] = opts.name;
    }
  }

  writeMeta(directory, tenant, meta);
}
