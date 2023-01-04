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
  const [tableName, chunkName] = meta.key_index[key];

  if (tableName !== table) {
    throw `No such key "${key}" in table "${table}"`;
  }

  const chunk = readChunk(directory, tenant, chunkName);

  if (opts.expandKeys) {
    return recursivelyExpandDocument(
      directory,
      tenant,
      chunk[key],
    );
  }
  return chunk[key];
}
