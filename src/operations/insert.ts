import { resolve } from "std/path/mod.ts";
import { readFile, writeFile } from "@/util/fileOperations.ts";

export function insert(
  directory: string,
  tenant: string,
  table: string,
  document: unknown,
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  const key = crypto.randomUUID();
  const curTable = readFile(tablePath);
  curTable.documents[key] = document;
  writeFile(tablePath, curTable);
  return key;
}
