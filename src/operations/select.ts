import { readChunk, readMeta } from "../util/fileOperations.ts";
import { evaluateCondition, parseCondition } from "../util/condition.ts";
import { recursivelyExpandDocument } from "../util/expandDocument.ts";
import { Document } from "../util/types.ts";

interface Match {
  [key: string]: string | Match;
}

interface QueryOptions {
  maxResults: number;
  showKeys: boolean;
  expandKeys: boolean;
  where: string;
}

export function selectQuery(
  directory: string,
  tenant: string,
  table: string,
  opts: QueryOptions,
) {
  const meta = readMeta(directory, tenant);

  if (!Object.hasOwn(meta.table_index, table)) {
    throw `No table with name "${table}" to select from`;
  }

  const results: Document[] = [];

  for (const chunkName of meta.table_index[table].chunks) {
    const chunk = readChunk(directory, tenant, chunkName);
    for (const key of Object.keys(chunk)) {
      const document = chunk[key];
      if (opts.maxResults === results.length) {
        break;
      }

      if (
        opts.where === "" ||
        evaluateCondition(parseCondition(opts.where, document))
      ) {
        const doc = opts.expandKeys
          ? recursivelyExpandDocument(directory, tenant, document)
          : document;

        if (opts.showKeys) {
          results.push({
            ...doc,
            ...{
              key,
            },
          });
        } else {
          results.push(doc);
        }
      }
    }
  }

  return results;
}
