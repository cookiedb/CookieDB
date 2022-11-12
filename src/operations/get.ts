import { resolve } from "std/path/mod.ts";
import { readFile } from "@/util/fileOperations.ts";

export function get(
  directory: string,
  tenant: string,
  table: string,
  key: string,
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  const curTable = readFile(tablePath);
  return curTable.documents[key];
}
