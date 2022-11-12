import { ensureDirSync } from "std/fs/mod.ts";
import { resolve } from "std/path/mod.ts";

export function drop(directory: string, tenant: string, table: string) {
  // Make sure tenant exists
  ensureDirSync(resolve(directory, tenant));

  // Make file if not exists
  const tablePath = resolve(directory, tenant, `${table}.ck`);

  try {
    Deno.removeSync(tablePath);
  } catch (err) {
    throw "Cannot drop table if doesn't exist";
  }
}
