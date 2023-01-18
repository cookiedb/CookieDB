import { assert, assertEquals } from "./deps.ts";
import { createUser, init, start } from "./mod.ts";
import { readMeta } from "./src/util/fileOperations.ts";

// delete folder to get fresh start
try {
  Deno.removeSync("./test", { recursive: true });
} catch {
  // no op, the directory didn't already exist
}

// initialize the database folder
init("./test");

// create two users
const { username: name, token: auth } = createUser("./test", {
  username: "user",
});
assertEquals(name, "user");

const { username: name_admin, token: auth_admin } = createUser("./test", {
  username: "admin",
  admin: true,
});
assertEquals(name_admin, "admin");

const basicFetchOptions = {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${auth}`,
  },
};

const adminFetchOptions = {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${auth_admin}`,
  },
};

Deno.test({
  name: "Start up the database",
  fn() {
    start("./test");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to connect to database",
  async fn() {
    const req = await fetch("http://localhost:8777/", basicFetchOptions);
    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to create a table",
  async fn() {
    const req = await fetch(
      "http://localhost:8777/create/table",
      basicFetchOptions,
    );

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to create a table with a schema",
  async fn() {
    const req = await fetch("http://localhost:8777/create/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: "unique string",
        description: "nullable string",
        cool: "boolean",
        exists: "nullable boolean",
        age: "number",
        height: "nullable number",
        best_friend: "nullable foreign_key",
        nested: {
          property: "string",
          another_level: {
            property: "string",
          },
        },
      }),
    });

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

let yogiKey: string;

Deno.test({
  name: "Able to insert into a table with no schema",
  async fn() {
    const req = await fetch("http://localhost:8777/insert/table", {
      ...basicFetchOptions,
      body: JSON.stringify({
        "name": "Yogi",
        "age": 12,
        "cool": true,
        "description": "The best avenger",
      }),
    });

    assertEquals(req.status, 200);
    yogiKey = await req.text();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

let yogiKeys: string[] = [];

Deno.test({
  name: "Able to bulk insert into a table",
  async fn() {
    const req = await fetch("http://localhost:8777/insert/table", {
      ...basicFetchOptions,
      body: JSON.stringify([
        {
          "name": "Yogi1",
          "age": 13,
          "cool": true,
          "description": "The best avenger",
        },
        {
          "name": "Yogi2",
          "age": 14,
          "cool": true,
          "description": "The best avenger",
        },
        {
          "name": "Yogi3",
          "age": 15,
          "cool": true,
          "description": "The best avenger",
        },
        {
          "name": "Yogi4",
          "age": 16,
          "cool": true,
          "description": "The best avenger",
        },
      ]),
    });

    assertEquals(req.status, 200);
    yogiKeys = await req.json();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Schema properly validates incorrect input",
  async fn() {
    let req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({}),
    });

    assertEquals(
      await req.text(),
      'Schema and document have different keys. Expected ["name","description","cool","exists","age","height","best_friend","nested"], got []',
    );

    req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: null,
        description: null,
        cool: null,
        exists: null,
        age: null,
        height: null,
        best_friend: null,
        nested: null,
      }),
    });

    assertEquals(
      await req.text(),
      'Expected string for key "name", got "null"',
    );

    req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: "Bryan",
        description: null,
        cool: true,
        exists: null,
        age: 18,
        height: null,
        best_friend: null,
        nested: null,
      }),
    });

    assertEquals(
      await req.text(),
      'Expected {"property":"string","another_level":{"property":"string"}} for key "nested", got "null" instead',
    );

    req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: "Bryan",
        description: "gigachad",
        cool: true,
        exists: false,
        age: 18,
        height: 100,
        best_friend: null,
        nested: {
          property: "builder",
          another_level: {},
        },
      }),
    });

    assertEquals(
      await req.text(),
      'Schema and document have different keys. Expected ["property"], got []',
    );

    req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: 10010,
        description: true,
        cool: 1,
        exists: 1,
        age: "18",
        height: "100",
        best_friend: null,
        nested: {
          property: 10,
          another_level: {
            property: 0,
          },
        },
      }),
    });

    assertEquals(
      await req.text(),
      'Expected string for key "name", got "10010"',
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

let bryanKey: string;
let olekKey: string;

Deno.test({
  name: "Able to insert into a table with a schema",
  async fn() {
    let req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: "Bryan",
        description: "gigachad",
        cool: true,
        exists: null,
        age: 18,
        height: 100,
        best_friend: null,
        nested: {
          property: "builder",
          another_level: {
            property: "builder again",
          },
        },
      }),
    });

    bryanKey = await req.text();

    req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: "Olek",
        description: null,
        cool: true,
        exists: null,
        age: 18,
        height: null,
        best_friend: bryanKey,
        nested: {
          property: "coder",
          another_level: {
            property: "coder again",
          },
        },
      }),
    });

    olekKey = await req.text();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to get values by key",
  async fn() {
    let req = await fetch(
      `http://localhost:8777/get/table/${yogiKey}`,
      basicFetchOptions,
    );

    assertEquals(await req.json(), {
      name: "Yogi",
      age: 12,
      cool: true,
      description: "The best avenger",
      key: yogiKey,
    });

    req = await fetch(
      `http://localhost:8777/get/tableWithSchema/${olekKey}`,
      basicFetchOptions,
    );

    assertEquals(await req.json(), {
      name: "Olek",
      description: null,
      cool: true,
      exists: null,
      age: 18,
      height: null,
      best_friend: bryanKey,
      nested: { property: "coder", another_level: { property: "coder again" } },
      key: olekKey,
    });

    req = await fetch(`http://localhost:8777/get/tableWithSchema/${olekKey}`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        expand_keys: true,
      }),
    });

    assertEquals(await req.json(), {
      name: "Olek",
      description: null,
      cool: true,
      exists: null,
      age: 18,
      height: null,
      best_friend: {
        name: "Bryan",
        description: "gigachad",
        cool: true,
        exists: null,
        age: 18,
        height: 100,
        best_friend: null,
        nested: {
          property: "builder",
          another_level: { property: "builder again" },
        },
        key: bryanKey,
      },
      nested: { property: "coder", another_level: { property: "coder again" } },
      key: olekKey,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to update values by key",
  async fn() {
    let req = await fetch(`http://localhost:8777/update/table/${yogiKey}`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        name: "Yogi",
        age: 13,
        cool: true,
        description: "The best avenger",
      }),
    });

    assertEquals(await req.text(), "success");

    req = await fetch(
      `http://localhost:8777/update/tableWithSchema/${olekKey}`,
      {
        ...basicFetchOptions,
        body: JSON.stringify({
          name: "Yogi",
          age: 13,
          cool: true,
          description: "The best avenger",
          ooga: "hello",
        }),
      },
    );

    assertEquals(
      await req.text(),
      'Schema and document have different keys. Expected ["name","description","cool","exists","age","height","best_friend","nested"], got ["name","description","cool","exists","age","height","best_friend","nested","ooga"]',
    );

    req = await fetch(
      `http://localhost:8777/update/tableWithSchema/${olekKey}`,
      {
        ...basicFetchOptions,
        body: JSON.stringify({
          age: 19,
        }),
      },
    );

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to select values by query",
  async fn() {
    let req = await fetch(`http://localhost:8777/select/table`, {
      ...basicFetchOptions,
    });

    assertEquals(await req.json(), [
      {
        name: "Yogi",
        age: 13,
        cool: true,
        description: "The best avenger",
        key: yogiKey,
      },
      {
        name: "Yogi1",
        age: 13,
        cool: true,
        description: "The best avenger",
        key: yogiKeys[0],
      },
      {
        name: "Yogi2",
        age: 14,
        cool: true,
        description: "The best avenger",
        key: yogiKeys[1],
      },
      {
        name: "Yogi3",
        age: 15,
        cool: true,
        description: "The best avenger",
        key: yogiKeys[2],
      },
      {
        name: "Yogi4",
        age: 16,
        cool: true,
        description: "The best avenger",
        key: yogiKeys[3],
      },
    ]);

    req = await fetch(`http://localhost:8777/select/table`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        where: "eq($name, 'Yogi')",
      }),
    });

    assertEquals(await req.json(), [{
      name: "Yogi",
      age: 13,
      cool: true,
      description: "The best avenger",
      key: yogiKey,
    }]);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        where: "gt($age, 10)",
      }),
    });

    const everyone = [
      {
        name: "Bryan",
        description: "gigachad",
        cool: true,
        exists: null,
        age: 18,
        height: 100,
        best_friend: null,
        nested: {
          property: "builder",
          another_level: { property: "builder again" },
        },
        key: bryanKey,
      },
      {
        name: "Olek",
        description: null,
        cool: true,
        exists: null,
        age: 19,
        height: null,
        best_friend: bryanKey,
        nested: {
          property: "coder",
          another_level: { property: "coder again" },
        },
        key: olekKey,
      },
    ];

    assertEquals(await req.json(), everyone);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        where: "or(eq($age, 18), eq($nested.property, 'coder'))",
      }),
    });

    assertEquals(await req.json(), everyone);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        where: "or(eq($age, 18), eq($nested.property, 'coder'))",
        expand_keys: true,
      }),
    });

    assertEquals(await req.json(), [{
      "name": "Bryan",
      "description": "gigachad",
      "cool": true,
      "exists": null,
      "age": 18,
      "height": 100,
      "best_friend": null,
      "nested": {
        "property": "builder",
        "another_level": { "property": "builder again" },
      },
      "key": bryanKey,
    }, {
      "name": "Olek",
      "description": null,
      "cool": true,
      "exists": null,
      "age": 19,
      "height": null,
      "best_friend": {
        "key": bryanKey,
        "name": "Bryan",
        "description": "gigachad",
        "cool": true,
        "exists": null,
        "age": 18,
        "height": 100,
        "best_friend": null,
        "nested": {
          "property": "builder",
          "another_level": { "property": "builder again" },
        },
      },
      "nested": {
        "property": "coder",
        "another_level": { "property": "coder again" },
      },
      "key": olekKey,
    }]);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        where: "or(eq($age, 18), eq($nested.property, 'coder'))",
        max_results: 1,
      }),
    });

    assertEquals(await req.json(), [everyone[0]]);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to select values with aliases",
  async fn() {
    const req = await fetch(`http://localhost:8777/select/table`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        where: "eq($name, 'Yogi')",
        alias: {
          name: "$name",
          ageDoubled: "multiply($age, 2)",
          notCool: "not($cool)",
        },
      }),
    });

    assertEquals(await req.json(), [{
      name: "Yogi",
      ageDoubled: 26,
      notCool: false,
      key: yogiKey,
    }]);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to select values by order",
  async fn() {
    let req = await fetch(`http://localhost:8777/select/table`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        order: {
          by: "$age",
        },
        max_results: 1,
      }),
    });

    assertEquals(await req.json(), [{
      name: "Yogi4",
      age: 16,
      cool: true,
      description: "The best avenger",
      key: yogiKeys[3],
    }]);

    req = await fetch(`http://localhost:8777/select/table`, {
      ...basicFetchOptions,
      body: JSON.stringify({
        order: {
          descending: true,
          by: "$age",
        },
        max_results: 1,
      }),
    });

    assertEquals(await req.json(), [{
      name: "Yogi",
      age: 13,
      cool: true,
      description: "The best avenger",
      key: yogiKey,
    }]);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to delete documents by key",
  async fn() {
    let req = await fetch(
      `http://localhost:8777/delete/table/${yogiKey}`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "success");

    req = await fetch(
      `http://localhost:8777/delete/tableWithSchema/${olekKey}`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to query metadata for tables",
  async fn() {
    let req = await fetch(
      `http://localhost:8777/meta/table`,
      basicFetchOptions,
    );

    assertEquals(await req.json(), { schema: null, size: 441 });

    req = await fetch(
      `http://localhost:8777/meta/tableWithSchema`,
      basicFetchOptions,
    );

    assertEquals(await req.json(), {
      schema: {
        name: "unique string",
        description: "nullable string",
        cool: "boolean",
        exists: "nullable boolean",
        age: "number",
        height: "nullable number",
        best_friend: "nullable foreign_key",
        nested: { property: "string", another_level: { property: "string" } },
      },
      size: 222,
    });

    req = await fetch(
      `http://localhost:8777/meta`,
      basicFetchOptions,
    );

    assertEquals(await req.json(), {
      tables: {
        table: { schema: null },
        tableWithSchema: {
          schema: {
            name: "unique string",
            description: "nullable string",
            cool: "boolean",
            exists: "nullable boolean",
            age: "number",
            height: "nullable number",
            best_friend: "nullable foreign_key",
            nested: {
              property: "string",
              another_level: { property: "string" },
            },
          },
        },
      },
      size: 1733,
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to drop tables",
  async fn() {
    let req = await fetch(
      `http://localhost:8777/drop/table`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "success");

    req = await fetch(
      `http://localhost:8777/drop/tableWithSchema`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Properly cleaned up meta",
  fn() {
    assertEquals(readMeta("./test", "user"), {
      key_index: {},
      row_index: {},
      table_index: {},
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to create, regenerate, and delete users",
  async fn() {
    let req = await fetch(
      `http://localhost:8777/create_user`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "You are not an admin of this database");

    req = await fetch(
      `http://localhost:8777/create_user`,
      adminFetchOptions,
    );

    const user = await req.json();

    req = await fetch(
      `http://localhost:8777/regenerate_token/${user.username}`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "You are not an admin of this database");

    req = await fetch(
      `http://localhost:8777/regenerate_token/${user.username}`,
      adminFetchOptions,
    );

    assert(await req.text());

    req = await fetch(
      `http://localhost:8777/delete_user`,
      basicFetchOptions,
    );

    assertEquals(await req.text(), "You are not an admin of this database");

    req = await fetch(
      `http://localhost:8777/delete_user/${user.username}`,
      adminFetchOptions,
    );

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
