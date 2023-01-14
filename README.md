# CookieDB

> A byte sized db for everyone ;)

CookieDB is designed to be as simple as humanly possible while also having a
majority of the functionality you would expect of a db. It comes bundled with a
http server.

## Documentation

The full documentation can be found at https://docs.cookiedb.com. Everything
that remains in this README will eventually be moved over there.

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
