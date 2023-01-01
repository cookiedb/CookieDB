import {
  Document,
  Meta,
  PossibleTypes,
  Schema,
  SchemaKeywords,
} from "./types.ts";

function iterateThroughDocument(
  document: Document,
  schema: Schema,
  meta: Meta,
  table: string,
  callback: (key: string, value: PossibleTypes) => void,
) {
  for (const [key, value] of Object.entries(schema)) {
    const cur_key = table + "." + key;
    const subdocument = document[key];

    if (
      typeof value === "object" && typeof subdocument === "object" &&
      subdocument !== null
    ) {
      iterateThroughDocument(subdocument, value, meta, cur_key, callback);
      continue;
    }

    if (
      typeof value === "string" &&
      (subdocument === null || typeof subdocument !== "object")
    ) {
      const parts = value.split(" ") as SchemaKeywords[];

      if (!parts.includes("unique")) continue;

      callback(cur_key, subdocument);
    }
  }
}

/**
 * Indexes a document. Will override previous indexes.
 */
export function indexDocument(
  document: Document,
  schema: Schema,
  meta: Meta,
  table: string,
  id: string,
) {
  iterateThroughDocument(document, schema, meta, table, (key, value) => {
    if (!Object.hasOwn(meta.row_index, key)) {
      meta.row_index[key] = {};
    }

    if (value === null) {
      value = "null";
    }

    if (value === false) {
      value = "false";
    }

    if (value === true) {
      value = "true";
    }

    meta.row_index[key][value] = id;
  });
}

/**
 * Deletes indexes for a document. Please do not do this unless you know what you're doing.
 */
export function unindexDocument(
  document: Document,
  schema: Schema,
  meta: Meta,
  table: string,
) {
  iterateThroughDocument(document, schema, meta, table, (key, value) => {
    if (!Object.hasOwn(meta.row_index, key)) return;

    if (value === null) {
      value = "null";
    }

    if (value === false) {
      value = "false";
    }

    if (value === true) {
      value = "true";
    }

    delete meta.row_index[key][value];
  });
}

/**
 * Verify that a document has unique fields
 */
export function verifyDocument(
  document: Document,
  schema: Schema,
  meta: Meta,
  table: string,
  id = "",
) {
  iterateThroughDocument(document, schema, meta, table, (key, value) => {
    if (!Object.hasOwn(meta.row_index, key)) return;

    if (value === null) {
      value = "null";
    }

    if (value === false) {
      value = "false";
    }

    if (value === true) {
      value = "true";
    }

    if (Object.hasOwn(meta.row_index[key], value)) {
      if (id && meta.row_index[key][value] === id) return;
      throw `Field is not unique despite schema specifying it to be unique, ${value}`;
    }
  });
}
