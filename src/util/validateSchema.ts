import { resolve } from "std/path/mod.ts";
import { readFile } from "@/util/fileOperations.ts";

export function validateSchema(
  directory: string,
  tenant: string,
  document: Record<string, any>,
  schema: Record<string, any>,
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
      throw `Expected ${rawSpec} for key "${key}", got "${
        JSON.stringify(value)
      }"`;
    }
    if (typeof value === "object" && value !== null) {
      validateSchema(directory, tenant, document[key], schema[key]);
      continue;
    }

    const spec: "string" | "boolean" | "number" | "foreign_key" = rawSpec
      .replace("?", "");
    const nullable: boolean = rawSpec.includes("?");
    if (nullable && value === null) continue;

    // deal with foreign_key
    if (spec === "foreign_key") {
      if (!Object.hasOwn(metaTable.foreign_key_index, value)) {
        throw `Expected a foreign key for key "${key}", got "${value}"`;
      }
      continue;
    }

    // deal with everything else
    if (typeof value !== spec) {
      throw `Expected ${rawSpec} for key "${key}", got "${value}"`;
    }
  }
}
