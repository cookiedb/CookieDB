import { readChunk, readMeta } from "../util/fileOperations.ts";
import { evaluateCondition, parseCondition } from "../util/condition.ts";
import {
  recursivelyExpandAlias,
  recursivelyExpandDocument,
} from "../util/expandDocument.ts";
import { Alias, Document } from "../util/types.ts";

interface QueryOptions {
  maxResults: number;
  showKeys: boolean;
  expandKeys: boolean;
  where: string;
  alias?: Alias;
}

export function select(
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
        let doc = document;

        if (opts.alias && opts.expandKeys) {
          doc = recursivelyExpandDocument(directory, tenant, doc); // expand keys of document before alias
        }
        if (opts.alias) doc = recursivelyExpandAlias(opts.alias, doc);
        if (opts.expandKeys) {
          doc = recursivelyExpandDocument(directory, tenant, doc); // expand keys of alias
        }
        if (opts.showKeys) doc = { ...doc, key };

        results.push(doc);
      }
    }
  }

  return results;
}
