import { readMeta } from "../util/fileOperations.ts";
import { Schema } from "../util/types.ts";

/**
 * Return metadata for a table or a whole user
 */
export function meta(
  directory: string,
  tenant: string,
  table?: string,
) {
  const meta = readMeta(directory, tenant);
  if (table) {
    if (!Object.hasOwn(meta.table_index, table)) {
      throw `Cannot read metadata for non-existent table ${table}`;
    }

    return {
      schema: meta.table_index[table].schema,
    };
  }

  const result: Record<string, {
    schema: Schema | null;
  }> = {};

  for (const [tableName, tableContent] of Object.entries(meta.table_index)) {
    result[tableName] = {
      schema: tableContent.schema,
    };
  }

  return result;
}
