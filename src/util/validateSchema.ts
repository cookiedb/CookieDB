import {
  Document,
  Meta,
  Schema,
  SchemaKeywords,
  SchemaTypes,
} from "./types.ts";

/**
 * Takes in a document and a schema and validates the document for the schema definition.
 * DO NOT USE BY ITSELF, MAKE SURE TO VALIDATE UNIQUE. Use `verifyDocument` alongside this method.
 */
export function validateDocumentWithSchema(
  meta: Meta,
  document: Document,
  schema: Schema,
) {
  if (
    Object.keys(document).sort().join(",") !==
      Object.keys(schema).sort().join(",")
  ) {
    throw `Schema and document have different keys. Expected ${
      JSON.stringify(Object.keys(schema))
    }, got ${JSON.stringify(Object.keys(document))}`;
  }

  if (Object.hasOwn(document, "key")) {
    throw `Invalid document provided. Documents cannot have a key value of "key"`;
  }

  for (const [key, value] of Object.entries(document)) {
    if (!Object.hasOwn(schema, key)) {
      throw `Key "${key}" with value "${
        JSON.stringify(value)
      }" not found inside schema`;
    }
    const rawSpec = schema[key];

    // deal with objects
    if (
      value !== null && typeof value === "object" && typeof rawSpec !== "object"
    ) {
      throw `Expected ${JSON.stringify(rawSpec)} for key "${key}", got "${
        JSON.stringify(value)
      } instead"`;
    }
    if (typeof value === "object" && value !== null) {
      if (typeof schema[key] !== "object") {
        throw `Expected ${schema[key]} for key "${key}" but got "${
          JSON.stringify(value)
        }`;
      }

      validateDocumentWithSchema(meta, value, schema[key] as Schema);
      continue;
    }

    if (
      typeof rawSpec === "object" &&
      (typeof value !== "object" || value === null)
    ) {
      throw `Expected ${JSON.stringify(rawSpec)} for key "${key}", got "${
        JSON.stringify(value)
      }" instead`;
    }

    if (typeof rawSpec !== "string") throw `Invalid specification: ${rawSpec}`;

    const spec = rawSpec.split(" ") as SchemaKeywords[];
    const type = spec.find((v) =>
      ["string", "boolean", "number", "foreign_key"].includes(v)
    ) as SchemaTypes;
    const nullable: boolean = spec.includes("nullable");
    // note to reader: the unique check is in verifyDocument and not in validateSchema /shrug
    if (nullable && value === null) continue;

    // deal with foreign_key
    if (type === "foreign_key") {
      if (typeof value !== "string") {
        throw `Expected a foreign key for key "${key}", got "${value}"`;
      }

      if (!Object.hasOwn(meta.key_index, value)) {
        throw `Expected a foreign key for key "${key}", got "${value}"`;
      }
      continue;
    }

    // deal with everything else
    // deno-lint-ignore valid-typeof
    if (typeof value !== type) {
      throw `Expected ${type} for key "${key}", got "${value}"`;
    }
  }
}

/**
 * This method makes sure that a schema isn't invalid.
 */
export function validateSchema(schema: unknown) {
  if (typeof schema !== "object" || schema === null) {
    throw `Unexpected value in schema ${typeof schema}`;
  }

  for (const [key, value] of Object.entries(schema)) {
    if (key.includes(".") || key.includes(",")) {
      throw `Key ${key} is invalid. Keys cannot have a "." or "," in them`;
    }

    if (key === "key") {
      throw `Key ${key} is invalid. Keys cannot be named "key"`;
    }

    if (typeof value === "object") {
      validateSchema(value);
      continue;
    }

    if (typeof value !== "string") {
      throw `Unexpected value in schema ${typeof schema}`;
    }

    const spec = value.split(" ");

    // Validate that there is at least one type in the schema
    let has_type = false;
    for (const value of spec) {
      if (["string", "boolean", "number", "foreign_key"].includes(value)) {
        has_type = true;
        continue;
      }
    }
    if (!has_type) throw `Schema value does not include any types in ${value}`;

    // Validate that there aren't duplicate keywords in the schema
    if (spec.length !== [...new Set(spec)].length) {
      throw `Duplicate schema value found in ${value}`;
    }

    // Validate that there aren't invalid keywords in the schema
    for (const value of spec) {
      if (
        !["string", "boolean", "number", "foreign_key", "nullable", "unique"]
          .includes(value)
      ) {
        throw `Unexpected schema value ${value} in ${value}`;
      }
    }
  }
}
