import { resolve } from "std/path/mod.ts";

import { readFile } from "@/util/fileOperations.ts";
import { evaluateCondition, parseCondition } from "@/util/condition.ts";
import { recursivelyExpandDocument } from "@/util/expandDocument.ts";

interface Match {
  [key: string]: string | Match;
}

function documentMatches(document: Record<string, any>, match: Match) {
  for (const [key, m] of Object.entries(match)) {
    if (!Object.hasOwn(document, key)) {
      return false;
    }

    const val = document[key];

    if (typeof m === "string") {
      const parseTree = parseCondition(m, val);
      if (!evaluateCondition(parseTree)) return false;
    } else {
      if (!documentMatches(val, m)) return false;
    }
  }

  return true;
}

interface QueryOptions {
  maxResults: number;
  showKeys: boolean;
  expandKeys: boolean;
}

export function selectQuery(
  directory: string,
  tenant: string,
  table: string,
  match: Match,
  opts: QueryOptions,
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);

  let curTable: {
    documents: Record<string, any>;
  };
  try {
    curTable = readFile(tablePath);
  } catch (_err) {
    throw "Table does not exist";
  }

  const results: any[] = [];

  for (const [key, document] of Object.entries(curTable.documents)) {
    if (opts.maxResults === results.length) {
      break;
    }

    if (documentMatches(document, match)) {
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

  return results;
}

export function selectQueries(
  directory: string,
  tenant: string,
  table: string,
  matches: Match[],
  statement: string,
  opts: QueryOptions,
) {
  const tablePath = resolve(directory, tenant, `${table}.ck`);

  let curTable: {
    documents: Record<string, any>;
  };
  try {
    curTable = readFile(tablePath);
  } catch (_err) {
    throw "Table does not exist";
  }

  const results: any[] = [];

  for (const [key, document] of Object.entries(curTable.documents)) {
    if (opts.maxResults === results.length) {
      break;
    }

    const curMatches: boolean[] = matches.map((match) =>
      documentMatches(document, match)
    );

    const parseTree = parseCondition(statement, curMatches);

    if (evaluateCondition(parseTree)) {
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

  return results;
}
