import { resolve } from "std/path/mod.ts";
import { readFile, writeFile } from "@/util/fileOperations.ts";

export function set(
  directory: string,
  tenant: string,
  table: string,
  key: string,
  document: unknown,
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  const curTable = readFile(tablePath);
  curTable.documents[key] = document;
  writeFile(tablePath, curTable);
  return key;
}
