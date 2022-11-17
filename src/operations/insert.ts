import { resolve } from "../../deps.ts";
import { readFile, writeFile } from "../util/fileOperations.ts";
import { Document } from "../util/types.ts";
import { validateSchema } from "../util/validateSchema.ts";

export function insert(
  directory: string,
  tenant: string,
  table: string,
  document: Document,
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

export function bulkInsert(
  directory: string,
  tenant: string,
  table: string,
  documents: Document[],
) {
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  const tablePath = resolve(directory, tenant, `${table}.ck`);

  let curTable;
  try {
    curTable = readFile(tablePath);
  } catch (_err) {
    throw "Table does not exist";
  }

  const metaTable = readFile(metaPath);

  const keys = [];

  for (const document of documents) {
    const key = crypto.randomUUID();

    if (curTable.schema !== null) {
      validateSchema(directory, tenant, document, curTable.schema);
    }
    curTable.documents[key] = document;
    metaTable.foreign_key_index[key] = table;
    keys.push(key);
  }

  writeFile(tablePath, curTable);
  writeFile(metaPath, metaTable);

  return keys;
}
