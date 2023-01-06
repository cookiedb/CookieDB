# CookieDB

> A byte sized db for everyone ;)

CookieDB is designed to be as simple as humanly possible while also having a
majority of the functionality you would expect of a db. It comes bundled with a
http server.

## Philosophy

Practically no database with any popularity was built with the idea of developer
experience in mind. DX is probably one of the most important choices for me
personally when building a project and I was exhausted with all of the horrible
options we had to choose from.

- SQL databases are just okay, but interacting with them from a web platform is
  a nightmare with all of the headache that is connections and pooling. I just
  want to write a serverless app!
- NoSQL databases are also just okay, but the lack of foreign key constraints
  and joins makes them not viable long term. Denormalization is an awful
  paradigm.

What is CookieDB trying to do, and what is it not trying to do?

- CookieDB is trying to be a lightweight, usuable database built with the
  serverless web in mind (but usable on other platforms as well). It should have
  awesome DX that makes people want to come back for more, or to refactor old
  code to use it. It should "just work" for basically every imaginable usecase.
  It should be multi-tenant to bring down the cost of cloud hosting.
- CookieDB is not trying to be the fastest database. It is not trying to be
  massively horizontally scalable. It is not trying to thwart the CAP theorum.

## Installation

Right now, the api is not stable so we will not be providing a proper
executable. If you still insist on trying it out,
[install deno](https://deno.land/#installation), then run the following command:

```bash
deno install -Af -n cookie https://deno.land/x/cookiedb/cli.ts
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
- create_user: Creates a database tenant in the configuration file. It accepts a
  directory with a initialized cookie database as an argument and three flags.
  If no directory is specified, it assumes the current directory. All flags are
  optional.
  - One of them is `--username=EXAMPLE_NAME`, which allows you to specify the
    username of this user. This must be unique among users.
  - The second is `--token=EXAMPLE_AUTH`, **this should only be used if you
    already have a cryptographically secure token**.
  - The third is `--admin`, this should only be used if you want this user to be
    able to programatically create and remove users
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
have are strings. Strings are made up of properties of that field. If you choose
to define a schema, the properties must include a type. Valid types are
"string", "number", "boolean", and "foreign_key". There are also additional
keywords you made add that helps enforce consistency at a database level. There
are currently two of them: "unique" and "nullable".

Ex:

```javascript
const req = await fetch("/create/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

const res = await req.text(); // "success"

// OR

const req = await fetch("/create/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: "unique string",
    description: "nullable string",
    is_cool: "boolean",
    age: "number",
    best_friend: "nullable foreign_key",
    nested: {
      property: "string",
    },
  }),
});

const res = await req.text(); // "success"
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

const res = await req.text(); // "success"
```

#### POST: `/insert/:table:`

Inserts a document into `:table:`, will error out if table does not exist. If
passed an array, it will bulk insert several documents.

Note: Documents may not have a top-level key by the name of `key`. They also may
not have any keys with a `.` in them.

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

const res = await req.text(); // key of record, ex: "b94a8779-f737-466b-ac40-4dfb130f0eee"

// OR

const req = await fetch("/insert/dogs", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify([
    {
      name: "Yogi",
      age: 9,
    },
    {
      name: "Charles",
      age: 2,
    },
    {
      name: "KK",
      age: 5,
    },
  ]),
});

const res = await req.text(); // key of record, ex: "b94a8779-f737-466b-ac40-4dfb130f0eee"
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

const res = await req.json(); // JSON object representing document, ex: { name: "Bryan", description: "Just a cool guy", is_cool: true, age: 18, best_friend: null, nested: { property: "builder"}}
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

const res = await req.text(); // "success"
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

const res = await req.text(); // "success"
```

#### POST: `/meta/:table?:`

Gets metadata from `:table:` if specified. Otherwise it will return metadata for
all tables for the user.

Ex:

```javascript
const req = await fetch("/meta/users", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

const res = await req.json(); // { name: "string", description: "nullable string", is_cool: "boolean", age: "number", best_friend: "nullable foreign_key", nested: { property: "string"}}
```

#### POST: `/select/:table:`

Selects a number of documents from `:table:` given a query or queries, will
error out if table does not exist.

In the simple case, there is simply just a `where` object. Let's see a sample:

```json
{
  "where": "eq($name, 'Bryan')"
}
```

For more complex queries, this is not enough. We can instead create a nested
query with more complicated statements using CookieDB's extensive expressions
(see below). An example is:

```json
{
  "where": "or(eq($age, 18), eq($nested.property, 'builder'))"
}
```

This would return any document that has an `age` property equal to `18` or a
`nested.property` equal to `'builder'`. The statement can be arbitrarily
complex.

Next up on the list of features, we have aliasing, which allows us not only to
simply choose what fields we would like to have and which we would like to
ignore, but also allows us to do arbitrary operations on them. One example
usecase is:

```jsonc
{
  "alias": {
    "name": "$name", // keep this field without any modifications
    "is_not_cool": "not($is_cool)", // make a new field name that uses selected documents as inputs!
    "age_doubled": "multiply($age, 2)",
    "flattened": "$nested.property"
  }
}
```

In addition to this, there are even more optional arguments that can be included
to customize the query. Here is an example:

```jsonc
{
  "where": "and(eq($name, 'Bryan'), gt($age, 10))",
  "max_results": 1, // limits the number of results to a certain value (default: -1)
  "show_keys": false, // return the keys of documents along with them (default: true)
  "expand_keys": true, // automatically join foreign keys with the objects they link to (default: false)
  "order": {
    "by": "$age", // can be an arbitrary expression
    "descending": true // defaults to false
  }
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
    where: "and(eq($name, 'Bryan'), gt($age, 10))",
    max_results: 1,
    show_keys: true,
    expand_keys: true,
  }),
});

const res = await req.json(); // list of matching documents, ex: [{ name: "Bryan", description: "Just a cool guy", is_cool: true, age: 18, best_friend: null, nested: { property: "builder"}}]
```

#### POST: `/create_user/`

Note: You must have an admin key to use this route

Creates a user with an optional username and api token.

```json
{
  "username": "test_user",
  "token": "a_randomly_generated_token"
}
```

#### POST: `/delete_user/:username:`

Note: You must have an admin key to use this route

Deletes a user with by username

```json
{
  "username": "test_user"
}
```

### Expressions

We see here that we can query parts of objects using some simple expressions.
These can be arbitrarily nested and combined. As you may have guessed, the `$`
operator allows for us to express that the value is a property and not just a .
There are quite a few operators:

- `and`
  - Takes in any number of inputs and does logical and on them
  - ex: `and(true, true, true)`
- `or`
  - Takes in any number of inputs and does logical or on them
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
  - ex: `lt_or_eq(11, 12)`
- `subtract`
  - Takes two numbers and subtracts the right from the left
  - ex: `eq(subtract(10, 5), 5)`
- `divide`
  - Takes two numbers and divides the right from the left. If the right is zero,
    this will return null
  - ex: `eq(divide(10, 5), 2)`
- `add`
  - Takes any amount of numbers and adds them together. It also works as a
    concat function for strings.
  - ex: `eq(add(1, 2, 3), 6)`
- `multiply`
  - Takes any amount of numbers and multiplies them together
  - ex: `eq(multiply(1, 2, 3), 6)`
- `current_time`
  - Returns the current time in Unix milliseconds
  - ex: `eq(current_time(), 1668304518135)`*
- `to_date_string`
  - Takes in unix milliseconds and returns a string representation
  - ex: `eq(to_date_string(1668304518135), 'Sun, 13 Nov 2022 01:55:18 GMT')`
- `year`
  - Takes in unix milliseconds and returns the UTC year
  - ex: `eq(year(1668304518135), 2022)`
- `month`
  - Takes in unix milliseconds and returns the UTC month (0-11)
  - ex: `eq(month(1668304518135), 10)`
- `hour`
  - Takes in unix milliseconds and returns the UTC hour (0-23)
  - ex: `eq(hour(1668304518135), 1)`
- `minute`
  - Takes in unix milliseconds and returns the UTC minute (0-59)
  - ex: `eq(minute(1668304518135), 55)`
- `second`
  - Takes in unix milliseconds and returns the UTC minute (0-59)
  - ex: `eq(second(1668304518135), 18)`
- `day_of_week`
  - Takes in unix milliseconds and returns the UTC day of week (0-6)
  - ex: `eq(day_of_week(1668304518135), 0)`
- `day_of_month`
  - Takes in unix milliseconds and returns the UTC day of month (1-31)
  - ex: `eq(day_of_month(1668304518135), 13)`
- `if_else`
  - Takes in a boolean expression, and two results. If the boolean expression is
    true, it will take the first child, otherwise it will take the second child
  - ex: `if_else(true, true, false)`
- `not`
  - Takes in one value, it will return false if given a truthy value, else it
    will return true
  - ex: `not(false)`
- `in_range`
  - Takes in an input number, a minimum, and a maximum number. It will return
    true if the input is in the range, otherwise it will return false.
  - ex: `in_range(5, 0, 10)`
- `coalesce`
  - Takes in any number of inputs and returns the first non-null one
  - ex: `coalesce(null, true, 'hi')`
- `abs`
  - Takes in a number and returns the absolute value
  - ex: `eq(abs(-5), 5)`
- `asin`
  - Takes in a number and returns the arcsine
  - ex: `eq(asin(0), 0)`
- `acos`
  - Takes in a number and returns the arccosine
  - ex: `eq(acos(1), 0)`
- `atan`
  - Takes in a number and returns the arctangent
  - ex: `eq(atan(0), 0)`
- `atan2`
  - Takes in a number and returns the arctan2 (NOTE: the arguments are y, x and
    not x, y)
  - ex: `eq(atan(1, 1), divide(pi(), 4))`*
- `average`
  - Takes in any number of numeric children and returns the average
  - ex: `eq(average(0, 5, 10), 5)`
- `ceil`
  - Takes in a numeric value and returns the ceiling
  - ex: `eq(ceil(5.1), 6)`
- `floor`
  - Takes in a numeric value and returns the floor
  - ex: `eq(floor(5.1), 5)`
- `round`
  - Takes in a numeric value and returns the value rounded
  - ex: `eq(round(5.1), 5)`
- `sin`
  - Takes in an angle in radians and returns the sine
  - ex: `eq(sin(0), 0)`
- `cos`
  - Takes in an angle in radians and returns the cosine
  - ex: `eq(cos(0), 1)`
- `tan`
  - Takes in an angle in radians and returns the tangent
  - ex: `eq(tan(0), 0)`
- `sec`
  - Takes in an angle in radians and returns the secant, returns null instead of
    throwing
  - ex: `eq(sec(0), 1)`
- `csc`
  - Takes in an angle in radians and returns the cosecant, returns null instead
    of throwing
  - ex: `eq(csc(0), null)`
- `cot`
  - Takes in an angle in radians and returns the cotangent, returns null instead
    of throwing
  - ex: `eq(cot(0), null)`
- `degrees`
  - Takes in an angle in radians and returns the degrees
  - ex: `eq(degrees(pi()), 180)` `radians`
  - Takes in an angle in radians and returns the degrees
  - ex: `eq(radians(180), pi())`
- `exp`
  - Takes in some value and returns e to the power of that value
  - ex: `eq(exp(0),1)`
- `power`
  - Takes in value for base and exponent and computes the power
  - ex: `eq(power(2, 4), power(4, 2))`
- `log`
  - Takes in a value for input and base and computes the logarithm
  - ex: `eq(log(256, 2), 8)`
- `max`
  - Takes in any amount of elements and returns the maximum value
  - ex: `eq(max(1, 5, -40, 1000), 1000)`
- `min`
  - Takes in any amount of elements and returns the minimum value
  - ex: `eq(min(1, 5, -40, 1000), -40)`
- `pi`
  - Returns the value of pi
  - ex: `eq(pi(), 3.141592653589793)`
- `random`
  - Returns a random value from 0 to 1
  - ex: `eq(random(), 0.42637976796743104)`*
- `sign`
  - Returns the sign of the number. If positive 1, if negative -1, otherwise 0
  - ex: `eq(sign(-3), -1)`
- `sqrt`
  - Takes in a number and returns the square root
  - ex: `eq(sqrt(4), 2)`

\* May not work as described due to technicalities
