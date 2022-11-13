import { resolve } from "std/path/mod.ts";
import { readFile } from "./fileOperations.ts";

export function recursivelyExpandDocument(
  directory: string,
  tenant: string,
  document: any,
) {
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  const metaTable: {
    foreign_key_index: Record<string, string>;
  } = readFile(metaPath);

  for (const [key, value] of Object.entries(document)) {
    if (typeof value === "string") {
      // assign document[key] to expanded document and call method
      if (Object.hasOwn(metaTable.foreign_key_index, value)) {
        const tableName = metaTable.foreign_key_index[value];
        const tablePath = resolve(directory, tenant, `${tableName}.ck`);
        const table: {
          documents: Record<string, any>;
        } = readFile(tablePath);

        document[key] = recursivelyExpandDocument(
          directory,
          tenant,
          table.documents[value],
        );
      }
    } else if (typeof value === "object" && value !== null) {
      document[key] = recursivelyExpandDocument(
        directory,
        tenant,
        document[key],
      );
    }
  }
  return document;
}
