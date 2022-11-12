import { ensureDirSync } from "std/fs/mod.ts";
import { resolve } from "std/path/mod.ts";
import { writeFile } from "@/util/fileOperations.ts";

export function create(directory: string, tenant: string, table: string) {
  // Make sure tenant exists
  ensureDirSync(resolve(directory, tenant));

  // Make file if not exists
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  try {
    Deno.lstatSync(tablePath);
  } catch (_err) {
    writeFile(tablePath, {
      schema: null,
      documents: {},
    });
  }
  console.log(directory, tenant, table);
}
