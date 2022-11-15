import { resolve } from "../../deps.ts";
import { writeFile } from "../util/fileOperations.ts";
import { Schema } from "../util/types.ts";

export function create(
  directory: string,
  tenant: string,
  table: string,
  schema: Schema | null,
) {
  // Make file if not exists
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  try {
    Deno.lstatSync(tablePath);
  } catch (_err) {
    writeFile(tablePath, {
      schema,
      documents: {},
    });
  }
}
