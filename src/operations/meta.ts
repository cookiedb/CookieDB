import { resolve } from "../../deps.ts";
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
  let size = 0;
  const tenantDir = resolve(directory, "users", tenant);
  const meta = readMeta(directory, tenant);
  if (table) {
    if (!Object.hasOwn(meta.table_index, table)) {
      throw `Cannot read metadata for non-existent table ${table}`;
    }

    for (const chunk of meta.table_index[table].chunks) {
      size += Deno.statSync(resolve(tenantDir, chunk + ".ck")).size;
    }

    return {
      schema: meta.table_index[table].schema,
      size,
    };
  }

  for (const file of Deno.readDirSync(tenantDir)) {
    size += Deno.statSync(resolve(tenantDir, file.name)).size;
  }

  const result: {
    tables: Record<string, {
      schema: Schema | null;
    }>;
    size: number;
  } = {
    tables: {},
    size,
  };

  for (const [tableName, tableContent] of Object.entries(meta.table_index)) {
    result.tables[tableName] = {
      schema: tableContent.schema,
    };
  }

  return result;
}
