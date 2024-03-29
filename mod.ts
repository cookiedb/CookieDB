import { cryptoRandomString, ensureDirSync, serve, serveTls } from "./deps.ts";

import defaultConfig from "./src/defaultConfig.json" assert { type: "json" };
import { create } from "./src/operations/create.ts";
import { bulkInsert, insert } from "./src/operations/insert.ts";
import { get } from "./src/operations/get.ts";
import { update } from "./src/operations/update.ts";
import { drop } from "./src/operations/drop.ts";
import { deleteByKey, deleteByQuery } from "./src/operations/delete.ts";
import { select } from "./src/operations/select.ts";
import {
  deleteTenant,
  ensureTenant,
  readConfig,
  writeConfig,
} from "./src/util/fileOperations.ts";
import { meta } from "./src/operations/meta.ts";
import { Config } from "./src/util/types.ts";
import { validateAdmin } from "./src/util/validateAdmin.ts";
import { edit } from "./src/operations/edit.ts";

/**
 * Initialize CookieDB in directory
 */
export function init(directory: string) {
  console.log("Making directory...");
  ensureDirSync(directory);
  console.log("Made directory");
  console.log("Generating config...");
  writeConfig(directory, defaultConfig);
  console.log("Generated config");
}

/**
 * Start the CookieDB http server on directory
 */
export function start(directory: string) {
  let config: Config = {
    ...defaultConfig,
    ...readConfig(directory),
  };

  const serveRequest = async (req: Request) => {
    const url = new URL(req.url);
    const p = url.pathname;

    if (config.log) console.log(p);

    // deno-lint-ignore no-explicit-any
    let body: any = null;
    try {
      body = await req.json();
    } catch (_err) {
      // do nothing, there is no body
    }
    const path = p.replace("/", "").split("/");
    const route = path?.[0];
    const table = path?.[1];
    const key = path?.[2];

    try {
      const authHeader = req.headers.get("authorization");
      if (authHeader === null) throw "No authorization header";
      if (authHeader.split("Bearer ").length === 1) {
        throw "Authorization header is not bearer token";
      }
      if (!Object.hasOwn(config.users, authHeader.replace("Bearer ", ""))) {
        throw "Authorization header invalid";
      }
      const tenant = config.users[authHeader.replace("Bearer ", "")];

      ensureTenant(directory, tenant);

      switch (route) {
        case "create": {
          create(directory, tenant, table, body);
          break;
        }

        case "drop": {
          drop(directory, tenant, table);
          break;
        }

        case "insert": {
          if (Array.isArray(body)) {
            const keys = bulkInsert(directory, tenant, table, body, {
              maxDocumentsPerChunk: config.advanced.max_documents_per_chunk,
            });
            return new Response(JSON.stringify(keys), { status: 200 });
          } else {
            const key = insert(directory, tenant, table, body, {
              maxDocumentsPerChunk: config.advanced.max_documents_per_chunk,
            });
            return new Response(key, { status: 200 });
          }
        }

        case "select": {
          body = body ?? {};

          const results = select(
            directory,
            tenant,
            table,
            {
              maxResults: body.max_results ?? 100,
              expandKeys: body.expand_keys ?? false,
              where: body.where ?? "",
              alias: body.alias,
              order: body.order,
            },
          );
          return new Response(JSON.stringify(results), { status: 200 });
        }

        case "update": {
          update(directory, tenant, table, key, body);
          break;
        }

        case "delete": {
          let res: Response | undefined;
          if (key) {
            return new Response(
              JSON.stringify(deleteByKey(directory, tenant, table, key)),
              { status: 200 },
            );
          }

          if (body.where) {
            return new Response(
              JSON.stringify(
                deleteByQuery(directory, tenant, table, body.where),
              ),
              { status: 200 },
            );
          }

          if (!res) {
            throw "You must include either a key or a query";
          }
          return res;
        }

        case "get": {
          body = body ?? {};
          const expandKeys = body.expand_keys ?? false;
          return new Response(
            JSON.stringify(get(directory, tenant, table, key, { expandKeys })),
            { status: 200 },
          );
        }

        case "meta": {
          return new Response(
            JSON.stringify(meta(directory, tenant, table)),
            { status: 200 },
          );
        }

        case "edit": {
          body = body ?? {};
          edit(directory, tenant, table, {
            name: body.name,
            schema: body.schema,
            alias: body.alias,
          });
          break;
        }

        case "create_user": {
          body = body ?? {};

          validateAdmin(tenant, config);

          const user = createUser(directory, {
            username: body.username,
            token: body.token,
            admin: body.admin,
          });

          config = {
            ...defaultConfig,
            ...readConfig(directory),
          };

          return new Response(
            JSON.stringify(user),
            { status: 200 },
          );
        }

        case "delete_user": {
          validateAdmin(tenant, config);

          deleteUser(directory, table);
          deleteTenant(directory, table);

          config = {
            ...defaultConfig,
            ...readConfig(directory),
          };

          break;
        }

        case "regenerate_token": {
          body = body ?? {};

          validateAdmin(tenant, config);

          const user = regenerateToken(directory, table);

          config = {
            ...defaultConfig,
            ...readConfig(directory),
          };

          return new Response(
            JSON.stringify(user),
            { status: 200 },
          );
        }
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      if (config.log) console.error(error);
      return new Response(JSON.stringify({ error }), { status: 400 });
    }
  };

  if (config.cert_file && config.key_file) {
    return serveTls(serveRequest, {
      port: config.port,
      certFile: config.cert_file,
      keyFile: config.key_file,
    });
  } else {
    return serve(serveRequest, {
      port: config.port,
    });
  }
}

/**
 * Create a database user in a directory
 */
export function createUser(
  directory: string,
  opts: { username?: string; token?: string; admin?: boolean },
) {
  const config: Config = readConfig(directory);

  const username = opts.username ?? cryptoRandomString({ length: 10 });
  let token = opts.token ?? cryptoRandomString({ length: 32, type: "base64" });

  while (Object.hasOwn(config.users, token)) {
    token = cryptoRandomString({ length: 32, type: "base64" });
  }

  config.users[token] = username;

  if (opts.admin) {
    config.admins.push(username);
  }

  writeConfig(directory, config);

  return {
    username,
    token,
  };
}

/**
 * Delete a database user in a directory
 */
export function deleteUser(
  directory: string,
  name: string,
) {
  const config: Config = readConfig(directory);

  if (config.admins.indexOf(name) !== -1) {
    config.admins.splice(config.admins.indexOf(name), 1);
  }

  for (const [token, cur_name] of Object.entries(config.users)) {
    if (name === cur_name) {
      delete config.users[token];
      break;
    }
  }

  writeConfig(directory, config);

  return name;
}

/**
 * Regenerates a user's token
 */
export function regenerateToken(
  directory: string,
  username: string,
) {
  const config: Config = readConfig(directory);
  let token = cryptoRandomString({ length: 32, type: "base64" });

  while (Object.hasOwn(config.users, token)) {
    token = cryptoRandomString({ length: 32, type: "base64" });
  }

  for (const [token, user] of Object.entries(config.users)) {
    if (user === username) {
      delete config.users[token];
    }
  }

  config.users[token] = username;

  writeConfig(directory, config);

  return {
    username: username,
    token,
  };
}
