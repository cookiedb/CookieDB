import { ensureDirSync, resolve } from "../../deps.ts";
import { Chunk, Meta } from "./types.ts";

export function readChunk(
  directory: string,
  tenant: string,
  chunkName: string,
): Chunk {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  try {
    const fileBuffer = Deno.readTextFileSync(chunkPath);
    return JSON.parse(fileBuffer);
  } catch (_err) {
    throw "Chunk does not exist";
  }
}

export function writeChunk(
  directory: string,
  tenant: string,
  chunkName: string,
  chunk: Chunk,
) {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  Deno.writeTextFileSync(chunkPath, JSON.stringify(chunk));
}

export function deleteChunk(
  directory: string,
  tenant: string,
  chunkName: string,
) {
  const chunkPath = resolve(directory, "users", tenant, `${chunkName}.ck`);
  Deno.remove(chunkPath);
}

export function readMeta(directory: string, tenant: string): Meta {
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  try {
    const fileBuffer = Deno.readTextFileSync(metaPath);
    return JSON.parse(fileBuffer);
  } catch (_err) {
    throw "Meta does not exist";
  }
}

export function writeMeta(directory: string, tenant: string, meta: Meta) {
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  Deno.writeTextFileSync(metaPath, JSON.stringify(meta));
}

export function ensureTenant(directory: string, tenant: string) {
  // Make sure tenant exists
  ensureDirSync(resolve(directory, "users", tenant));

  // Make metadata file if not exists
  const metaPath = resolve(directory, "users", tenant, "__meta__.ck");
  try {
    Deno.lstatSync(metaPath);
  } catch (_err) {
    writeMeta(directory, tenant, {
      key_index: {},
      table_index: {},
      chunk_index: {},
    });
  }
}

export function buildChunkTree(meta: Meta, table: string) {
  const chunkTree: Record<string, string[]> = {};

  for (const [key, chunk] of Object.entries(meta.table_index[table].keys)) {
    if (Object.hasOwn(chunkTree, chunk)) {
      chunkTree[chunk].push(key);
    } else {
      chunkTree[chunk] = [key];
    }
  }

  return chunkTree;
}
