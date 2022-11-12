import { resolve } from "std/path/mod.ts";
import { readFile, writeFile } from "@/util/fileOperations.ts";

export function del(
  directory: string,
  tenant: string,
  table: string,
  key: string,
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  const curTable = readFile(tablePath);
  delete curTable.documents[key];
  writeFile(tablePath, curTable);
  return key;
}
