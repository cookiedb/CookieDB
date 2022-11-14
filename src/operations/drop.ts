import { resolve } from "../../deps.ts";
import { readFile, writeFile } from "../util/fileOperations.ts";

export function drop(directory: string, tenant: string, table: string) {
  // Make file if not exists
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  const tablePath = resolve(directory, tenant, `${table}.ck`);

  const metaTable = readFile(metaPath);
  const curTable = readFile(tablePath);
  try {
    for (const key of Object.keys(curTable.documents)) {
      delete metaTable.foreign_key_index[key];
    }
    writeFile(metaPath, metaTable);

    Deno.removeSync(tablePath);
  } catch (err) {
    throw "Cannot drop table if doesn't exist";
  }
}
