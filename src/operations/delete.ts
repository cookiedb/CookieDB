import { resolve } from "../../deps.ts";
import { readFile, writeFile } from "../util/fileOperations.ts";

export function del(
  directory: string,
  tenant: string,
  table: string,
  key: string,
) {
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  try {
    const curTable = readFile(tablePath);
    delete curTable.documents[key];
    writeFile(tablePath, curTable);
  } catch (_err) {
    throw "Table does not exist";
  }

  const metaTable = readFile(metaPath);
  delete metaTable.foreign_key_index[key];
  writeFile(metaPath, metaTable);

  return key;
}
