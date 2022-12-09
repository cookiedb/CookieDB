import { evaluateCondition, parseCondition } from "./condition.ts";
import { readChunk, readMeta } from "./fileOperations.ts";
import { Alias, Document } from "./types.ts";

export function recursivelyExpandDocument(
  directory: string,
  tenant: string,
  document: Document,
) {
  const metaTable = readMeta(directory, tenant);

  for (const [key, value] of Object.entries(document)) {
    if (typeof value === "string") {
      // assign document[key] to expanded document and call method
      if (Object.hasOwn(metaTable.key_index, value)) {
        const [_, chunkName] = metaTable.key_index[value];
        const chunk = readChunk(directory, tenant, chunkName);

        document[key] = recursivelyExpandDocument(
          directory,
          tenant,
          chunk[value],
        );
      }
    } else if (typeof value === "object" && value !== null) {
      document[key] = recursivelyExpandDocument(
        directory,
        tenant,
        document[key] as Document,
      );
    }
  }
  return document;
}

export function recursivelyExpandAlias(
  alias: Alias,
  document: Document,
): Document {
  const doc: Document = {};

  for (const [key, value] of Object.entries(alias)) {
    if (typeof value === "string") {
      doc[key] = evaluateCondition(parseCondition(value, document));
    } else {
      doc[key] = recursivelyExpandAlias(value, document);
    }
  }

  return doc;
}
