import { resolve } from "std/path/mod.ts";
import { serve } from "std/http/server.ts";
import defaultConfig from "./config.json" assert { type: "json" };
import { create } from "./operations/create.ts";
import { insert } from "./operations/insert.ts";
import { get } from "./operations/get.ts";
import { set } from "./operations/set.ts";
import { selectQueries, selectQuery } from "./operations/select.ts";

interface Config {
  port: number
  log: boolean
}

export default function start(directory: string) {
  const config: Config = {
    ...defaultConfig,
    ...JSON.parse(Deno.readTextFileSync(resolve(directory, './config.json')))
  }

  serve(async (req: Request) => {
    const url = new URL(req.url)
    const p = url.pathname

    if(config.log) console.log(p)

    let body: any = {}
    try {
      body = await req.json()
    }
    catch(_err) {
      // do nothing, there is no body
    }
    const path = p.replace("/", "").split("/")
    const route = path?.[0]
    const table = path?.[1]
    const key = path?.[2]
    
    switch(route) {
      case "create": {
        create(directory, "hehehaw", table)
        break
      }

      case "insert": {
        const key = insert(directory, "hehehaw", table, body)

        return new Response(key, { status: 200 })
      }

      case "select": {
        try {
          const maxResults = body.max_results ?? 100
          const showKeys = body.show_keys ?? false
          if(body.query) {
            const results = selectQuery(directory, "hehehaw", table, body.query, {
              maxResults,
              showKeys
            })
            return new Response(JSON.stringify(results), { status: 200 })
          }
          if(!body.queries || !body.statement) return new Response("No query or no queries and statement were provided", { status: 400 })

          const results = selectQueries(directory, "hehehaw", table, body.queries, body.statement, {
            maxResults,
            showKeys
          })
          return new Response(JSON.stringify(results), { status: 200 })
        } catch(err) {
          return new Response(err, { status: 400 })
        }
      }

      case "set": {
        set(directory, "hehehaw", table, key, body)
        break
      }

      case "get": {
        return new Response(JSON.stringify(get(directory, "hehehaw", table, key)), { status: 200 })
      }
    }

    return new Response("success", { status: 200 })
  }, {
    port: config.port
  })
}