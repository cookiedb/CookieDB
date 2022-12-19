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
  order?: {
    descending?: boolean;
    by: string;
  };
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

  let results: Document[] = [];

  for (const chunkName of meta.table_index[table].chunks) {
    const chunk = readChunk(directory, tenant, chunkName);
    for (const key of Object.keys(chunk)) {
      const document = chunk[key];
      if (!opts.order && opts.maxResults === results.length) {
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

  if (opts.order !== undefined) {
    results.sort((a, b) => {
      if (!opts.order) return 0;
      const valueA = evaluateCondition(parseCondition(opts.order.by, a));
      const valueB = evaluateCondition(parseCondition(opts.order.by, b));

      if (valueA === null || valueB === null) throw `Can't order by null value`;

      if (opts.order.descending) {
        if (valueA > valueB) return 1;
        if (valueA < valueB) return -1;
      } else {
        if (valueA > valueB) return -1;
        if (valueA < valueB) return 1;
      }

      return 0;
    });

    if (opts.maxResults > 0) {
      results = results.slice(0, opts.maxResults);
    }
  }

  return results;
}
