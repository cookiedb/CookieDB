import { resolve } from "std/path/mod.ts";
import { readFile } from "@/util/fileOperations.ts";
import { recursivelyExpandDocument } from "../util/expandDocument.ts";

interface GetOptions {
  expandKeys: boolean;
}

export function get(
  directory: string,
  tenant: string,
  table: string,
  key: string,
  opts: GetOptions
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  try {
    const curTable = readFile(tablePath);

    if(opts.expandKeys) return recursivelyExpandDocument(directory, tenant, curTable.documents[key]);
    return curTable.documents[key];
  } catch (_err) {
    throw "Table does not exist";
  }
}
