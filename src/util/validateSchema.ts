import { resolve } from "../../deps.ts";
import { readFile } from "./fileOperations.ts";
import { Document, Schema } from "./types.ts";

export function validateSchema(
  directory: string,
  tenant: string,
  document: Document,
  schema: Schema,
) {
  const metaPath = resolve(directory, tenant, "__meta__.ck");
  const metaTable = readFile(metaPath);

  if (
    Object.keys(document).sort().join(",") !==
      Object.keys(schema).sort().join(",")
  ) {
    throw `Schema and document have different keys. Expected ${
      JSON.stringify(Object.keys(schema))
    }, got ${JSON.stringify(Object.keys(document))}`;
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

      validateSchema(directory, tenant, value, schema[key] as Schema);
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

    const spec = rawSpec.replace("?", "") as
      | "string"
      | "boolean"
      | "number"
      | "foreign_key";
    const nullable: boolean = rawSpec.includes("?");
    if (nullable && value === null) continue;

    // deal with foreign_key
    if (spec === "foreign_key") {
      if (typeof value !== "string") {
        throw `Expected a foreign key for key "${key}", got "${value}"`;
      }

      if (!Object.hasOwn(metaTable.foreign_key_index, value)) {
        throw `Expected a foreign key for key "${key}", got "${value}"`;
      }
      continue;
    }

    // deal with everything else
    // deno-lint-ignore valid-typeof
    if (typeof value !== spec) {
      throw `Expected ${rawSpec} for key "${key}", got "${value}"`;
    }
  }
}
