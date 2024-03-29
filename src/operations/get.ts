import { recursivelyExpandDocument } from "../util/expandDocument.ts";
import { readChunk, readMeta } from "../util/fileOperations.ts";

interface GetOptions {
  expandKeys: boolean;
}

/**
 * Gets a document give an id
 */
export function get(
  directory: string,
  tenant: string,
  table: string,
  key: string,
  opts: GetOptions,
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

  const chunk = readChunk(directory, tenant, chunkName);

  let document = chunk[key];

  if (opts.expandKeys) {
    document = recursivelyExpandDocument(
      directory,
      tenant,
      document,
    );
  }

  return {
    ...document,
    key,
  };
}
