# CookieDB

> A byte sized db for everyone ;)

CookieDB is designed to be as simple as humanly possible while also having a
majority of the functionality you would expect of a db. It comes bundled with a
http server.

## Installation

Right now, the api is not stable so we will not be providing a proper
executable. If you still insist on trying it out,
[install deno](https://deno.land/#installation), then run the following command:

```bash
deno install -A -n cookie https://deno.land/x/cookiedb
```

## Getting Started

To get started with cookieDB after installing it, run `cookie help`.

Let's create our first database instance. First we need to initialize the
folder. We can do this in one line using `cookie init ./demo`. This will create
a folder if it doesn't already exist. Let's cd into this directory
(`cd ./demo`).

Now, let's create our first user (or tenant as it is referred to in the code).
We can do this by running `cookie make_user --name=admin`. After this command is
run, it will update the config and it will print out the username and token of
this user.

Finally, let's start our database instance. `cookie start`. That's it!

## Documentation

### CLI

All cli commands are easily findable through the `cookie help` command, but if
you need more specifics, here they are:

- help: Show a menu listing off cookie CLI commands, as well as any global flags
- init: Initializes a cookie database instance given a certain folder. If no
  folder is specified, it will assume the current directory.
- make_user: Creates a database tenant in the configuration file. It accepts a
  directory with a initialized cookie database as an argument and two flags. If
  no directory is specified, it assumes the current directory. Both flags are
  optional.
  - One of them is `--name=EXAMPLE_NAME`, which allows you to specify the
    username of this user. This must be unique among users.
  - The other is `--auth=EXAMPLE_AUTH`, **this should only be used if you
    already have a cryptographically secure token**.
- start: Starts the database instance given a certain folder. If none is
  specified, it assumes the current directory.

### Config File

A complete config file likes like the following:

```javascript
{
  "port": "8777", // port where database will be hosted
  "log": false, // whether to log network requests
  "users": { // token:username pairs
    "ez04NL6y2umrnbwrTrzFgxaK6pXdo5ZA": "admin",
    "pzTvT53ksfaeBpUe7RPxEv1CWey1dQOA": "user"
  },
  "cert_file": "/path/to/certFile.crt", // certificate for TLS (optional)
  "key_file": "/path/to/keyFile.key" // key for TLS (optional)
}
```

### API

In an ideal world, a database driver would exist for every language that covers
every possible usecase. We do not live in an ideal world, and while these
drivers are being built, you may have to rely directly on the API. The routes
are listed below.

Two quick notes that apply to all API routes:

- All API routes require authorization with a `Bearer :token:`.
- The table's name must not include two underscores at the start and end (these
  are reserved tables).

#### POST: `/create/:table:`

Creates a table with the name `:table:`, if it does not already exist.

You may optionally define a schema that will be enforced when documents are
added and updated. A schema object is simply a JSON object in which all keys
have a value of a `"string"`, `"string?"`, `"number"`, `"number?"`, `"boolean"`,
`"boolean?"`, `array`, or `object`. The `?` represents that a value is nullable.

Ex:

```javascript
const req = await fetch("/create/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

const res = await res.text(); // "success"

// OR

const req = await fetch("/create/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "string",
    description: "string?",
    is_cool: "boolean",
    age: "number",
    best_friend: "foreign_key?",
    nested: {
      property: "string",
    },
  }),
});

const res = await res.text(); // "success"
```

#### POST: `/drop/:table:`

Deletes a table with the name `:table:`. Will error out if a table does not
exist with that name.

Ex:

```javascript
const req = await fetch("/drop/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

const res = await res.text(); // "success"
```

#### POST: `/insert/:table:`

Inserts a document into `:table:`, will error out if table does not exist.

Ex:

```javascript
const req = await fetch("/insert/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "Bryan",
    description: "Just a cool guy",
    is_cool: true,
    age: 18,
    best_friend: null,
    nested: {
      property: "builder",
    },
  }),
});

const res = await res.text(); // key of record, ex: "b94a8779-f737-466b-ac40-4dfb130f0eee"
```

#### POST: `/get/:table:/:key:`

Gets a document from `:table:` with the key of `:key:`, will error out if table
does not exist or if the key is not part of the table.

It takes one optional parameter in the body, which is `expand_keys`. If
provided, it will automatically expand any foreign keys into the whole object
they represent.

Ex:

```javascript
const req = await fetch("/insert/users/b94a8779-f737-466b-ac40-4dfb130f0eee", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    expand_keys: true, // doesn't do anything in this specific example
  }),
});

const res = await res.json(); // JSON object representing document, ex: { name: "Bryan", description: "Just a cool guy", is_cool: true, age: 18, best_friend: null, nested: { property: "builder"}}
```

#### POST: `/delete/:table:/:key:`

Deletes a document from `:table:` with the key of `:key:`, will error out if
table does not exist or if the key is not part of the table.

Ex:

```javascript
const req = await fetch("/delete/users/b94a8779-f737-466b-ac40-4dfb130f0eee", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

const res = await res.text(); // "success"
```

#### POST: `/update/:table:/:key:`

Updates a document from `:table:` with the key of `:key:`, will error out if
table does not exist or if the key is not part of the table.

Ex:

```javascript
const req = await fetch("/update/users/b94a8779-f737-466b-ac40-4dfb130f0eee", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "Bryan",
    description: "Just a cool guy",
    is_cool: true,
    age: 19, // Age is being set to a different number
    best_friend: null,
    nested: {
      property: "builder",
    },
  }),
});

const res = await res.text(); // "success"
```

#### POST: `/select/:table:`

Selects a number of documents from `:table:` given a query or queries, will
error out if table does not exist.

There are two ways of constructing a query, depending on how complicated it is.
In the simple syntax, there is simply just a `query` object. Let's see a sample:

```javascript
{
  query: {
    name: "eq($, 'Bryan')",
    age: "gt($, 10)"
  }
}
```

We see here that we can query parts of objects using some simple expressions.
These can be arbitrarily nested and combined. As you may have guessed, the `$`
represents the value at that specific key. There are quite a few operators:

- `and`
  - Takes in any number of inputs and does logical and on them
  - ex: `and(true, true, true)`
- `or`
  - Takes in any number of inputs and does logicial or on them
  - ex: `or(false, true, true)`
- `starts_with`
  - Returns true if a string starts with another string. Returns false if it
    does not.
  - ex: `starts_with('cookie', 'co')`
- `ends_with`
  - Returns true if a string ends with another string. Returns false if it does
    not.
  - ex: `ends_with('cookie', 'ie')`
- `to_lower`
  - Takes one input string and makes it lowercase
  - ex: `eq(to_lower('cOOKIE'), 'cookie')`
- `to_upper`
  - Takes one input string and makes it uppercase
  - ex: `eq(to_upper('Cookie'), 'COOKIE')`
- `gt`
  - Takes two numbers and checks if the left is greater than the right
  - ex: `gt(10, 5)`
- `lt`
  - Takes two numbers and checks if the left is less than the right
  - ex: `lt(5,10)`
- `eq`
  - Takes two values of any types and checks if they are equal
  - `eq(true, true)`
- `gt_or_eq`
  - Takes two numbers and checks if the left is greater than or equal to the
    right
  - ex: `gt_or_eq(12, 11)`
- `lt_or_eq`
  - Takes two numbers and checks if the left is less than or equal to the right
  - ex: `gt_or_eq(11, 12)`

For more complex queries, this is not enough. We can instead create a list of
query objects with a statement to explain how to combine them. An example is:

```javascript
{
  queries: [
    {
      age: "eq($, 18)",
    },
    {
      nested: {
        property: "eq($, 'builder')",
      }
    }
  ],
  statement: "or($0, $1)"
}
```

This would return any document that matches the first OR the second query. The
statement can be arbitrarily complex. There are three optional arguments that
can be included regardless of the type of query. Here is an example:

```javascript
{
  query: {
    name: "eq($, 'Bryan')",
    age: "gt($, 10)"
  },
  max_results: 1, // limits the number of results to a certain value
  show_keys: true, // return the keys of documents along with them
  expand_keys: true // automatically join foreign keys with the objects they link to
}
```

Ex:

```javascript
const req = await fetch("/select/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    query: {
      name: "eq($, 'Bryan')",
      age: "gt($, 10)",
    },
    max_results: 1,
    show_keys: true,
    expand_keys: true,
  }),
});

const res = await res.json(); // list of matching documents, ex: [{ name: "Bryan", description: "Just a cool guy", is_cool: true, age: 18, best_friend: null, nested: { property: "builder"}}]
```
