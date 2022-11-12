import { resolve } from "std/path/mod.ts";
import { readFile, writeFile } from "@/util/fileOperations.ts";
import { validateSchema } from "@/util/validateSchema.ts";

export function insert(
  directory: string,
  tenant: string,
  table: string,
  document: Record<string, any>,
) {
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  const tablePath = resolve(directory, tenant, `${table}.ck`);
  const key = crypto.randomUUID();

  let curTable;
  try {
    curTable = readFile(tablePath);
  } catch (_err) {
    throw "Table does not exist";
  }

  if (curTable.schema !== null) {
    validateSchema(directory, tenant, document, curTable.schema);
  }
  curTable.documents[key] = document;
  writeFile(tablePath, curTable);

  const metaTable = readFile(metaPath);
  metaTable.foreign_key_index[key] = table;
  writeFile(metaPath, metaTable);

  return key;
}
