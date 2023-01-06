import { readMeta, writeMeta } from "../util/fileOperations.ts";
import { Schema } from "../util/types.ts";

/**
 * Creates an empty table with an optional schema
 */
export function create(
  directory: string,
  tenant: string,
  table: string,
  schema: Schema | null,
) {
  const meta = readMeta(directory, tenant);

  if (table.includes(".")) {
    throw `Table name ${table} is invalid. Table names cannot have a "." in them`;
  }

  // If the table does not already exist, create it
  if (!Object.hasOwn(meta.table_index, table)) {
    meta.table_index[table] = {
      schema,
      chunks: [],
    };
    writeMeta(directory, tenant, meta);
  }
}
