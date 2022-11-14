import { assertEquals } from "./deps.ts";
import { createUser, init, start } from "./mod.ts";

let authHeader = "";

Deno.test("Set up database", () => {
  // delete folder to get fresh start
  try {
    Deno.removeSync("./test", { recursive: true });
  } catch (_err) {
    // no op, the directory didn't already exist
  }

  // initialize the database folder
  init("./test");

  // create two users
  const { name, auth } = createUser("./test", {
    name: "admin",
  });
  assertEquals(name, "admin");

  const { name: name2 } = createUser("./test", {
    name: "user",
  });
  assertEquals(name2, "user");

  authHeader = `Bearer ${auth}`;
});

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
    const req = await fetch("http://localhost:8777/", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to create a table",
  async fn() {
    const req = await fetch("http://localhost:8777/create/table", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to create a table with a schema",
  async fn() {
    const req = await fetch("http://localhost:8777/create/tableWithSchema", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        name: "string",
        description: "string?",
        cool: "boolean",
        exists: "boolean?",
        age: "number",
        height: "number?",
        best_friend: "foreign_key?",
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        "name": "Yogi",
        "age": 12,
        "cool": true,
        "description": "The best avenger",
      }),
    });

    yogiKey = await req.text();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Schema properly validates incorrect input",
  async fn() {
    let req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({}),
    });

    assertEquals(
      await req.text(),
      'Schema and document have different keys. Expected ["name","description","cool","exists","age","height","best_friend","nested"], got []',
    );

    req = await fetch("http://localhost:8777/insert/tableWithSchema", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
    let req = await fetch(`http://localhost:8777/get/table/${yogiKey}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.json(), {
      name: "Yogi",
      age: 12,
      cool: true,
      description: "The best avenger",
    });

    req = await fetch(`http://localhost:8777/get/tableWithSchema/${olekKey}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.json(), {
      name: "Olek",
      description: null,
      cool: true,
      exists: null,
      age: 18,
      height: null,
      best_friend: bryanKey,
      nested: { property: "coder", another_level: { property: "coder again" } },
    });

    req = await fetch(`http://localhost:8777/get/tableWithSchema/${olekKey}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
      },
      nested: { property: "coder", another_level: { property: "coder again" } },
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to update values by key",
  async fn() {
    let req = await fetch(`http://localhost:8777/update/table/${yogiKey}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
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
        method: "POST",
        headers: {
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          name: "Yogi",
          age: 13,
          cool: true,
          description: "The best avenger",
        }),
      },
    );

    assertEquals(
      await req.text(),
      'Schema and document have different keys. Expected ["name","description","cool","exists","age","height","best_friend","nested"], got ["name","age","cool","description"]',
    );

    req = await fetch(
      `http://localhost:8777/update/tableWithSchema/${olekKey}`,
      {
        method: "POST",
        headers: {
          "Authorization": authHeader,
        },
        body: JSON.stringify({
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        query: {
          name: "eq($, 'Yogi')",
        },
      }),
    });

    assertEquals(await req.json(), [{
      "name": "Yogi",
      "age": 13,
      "cool": true,
      "description": "The best avenger",
    }]);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        query: {
          age: "gt($, 10)",
        },
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
      },
    ];

    assertEquals(await req.json(), everyone);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        queries: [
          {
            age: "eq($, 18)",
          },
          {
            nested: {
              property: "eq($, 'coder')",
            },
          },
        ],
        statement: "or($0, $1)",
      }),
    });

    assertEquals(await req.json(), everyone);

    req = await fetch(`http://localhost:8777/select/tableWithSchema`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        queries: [
          {
            age: "eq($, 18)",
          },
          {
            nested: {
              property: "eq($, 'coder')",
            },
          },
        ],
        statement: "or($0, $1)",
        show_keys: true,
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
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        queries: [
          {
            age: "eq($, 18)",
          },
          {
            nested: {
              property: "eq($, 'coder')",
            },
          },
        ],
        statement: "or($0, $1)",
        max_results: 1,
      }),
    });

    assertEquals(await req.json(), [everyone[0]]);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to delete documents by key",
  async fn() {
    let req = await fetch(`http://localhost:8777/delete/table/${yogiKey}`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.text(), "success");

    req = await fetch(
      `http://localhost:8777/delete/tableWithSchema/${olekKey}`,
      {
        method: "POST",
        headers: {
          "Authorization": authHeader,
        },
      },
    );

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Able to drop tables",
  async fn() {
    let req = await fetch(`http://localhost:8777/drop/table`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.text(), "success");

    req = await fetch(`http://localhost:8777/drop/tableWithSchema`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
      },
    });

    assertEquals(await req.text(), "success");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
