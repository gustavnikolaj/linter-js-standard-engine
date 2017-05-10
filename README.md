# linter-js-standard-engine

[![Build Status](https://travis-ci.org/gustavnikolaj/linter-js-standard-engine.svg?branch=master)](https://travis-ci.org/gustavnikolaj/linter-js-standard-engine)
[![Build status](https://ci.appveyor.com/api/projects/status/ce33sbafvyhp9ovn?svg=true)](https://ci.appveyor.com/project/gustavnikolaj/linter-js-standard-engine)
[![Coverage Status](https://coveralls.io/repos/github/gustavnikolaj/linter-js-standard-engine/badge.svg?branch=master)](https://coveralls.io/github/gustavnikolaj/linter-js-standard-engine?branch=master)

A linter for GitHub's [Atom Editor](https://atom.io) using the [Linter
Plugin](https://github.com/atom-community/linter), for use with the
[`standard`](https://github.com/feross/standard) linter, and other linters based
on [`standard-engine`](https://github.com/flet/standard-engine).

## Installation

```console
$ apm install linter-js-standard-engine
```

Or, Settings → Install → Search for `linter-js-standard-engine`.

## Usage

`linter-js-standard-engine` recognizes the following linters if they're present
in the `devDependencies` of your `package.json` file:

* `happiness`
* `onelint`
* `semistandard`
* `standard`
* `uber-standard`

For example:

```json
{
  "devDependencies": {
    "standard": "*"
  }
}
```

Additionally you can specify what linter to use using by setting
`standard-engine` in your `package.json` file:

```json
{
  "standard-engine": "@novemberborn/as-i-preach"
}
```

The value must be a reference to a Node.js module that implements
`standard-engine`. The above example is for
[`@novemberborn/as-i-preach`](https://github.com/novemberborn/as-i-preach).

When set, the `standard-engine` value takes precedence over any other linters
discovered in the `devDependencies`.

The `package.json` file is discovered by walking up the file system, starting at
the file being linted. The first `package.json` file found is the one that's
used. The linter is invoked with its working directory set to the directory the
`package.json` file is in. The `package.json` file's location and contents are
cached.

If you have a project setup with multiple `package.json` files you can tell `linter-js-standard-engine` to ignore nested `package.json` files and keep
walking up the file system:

```json
{
  "standard-engine": {
    "skip": true
  }
}
```

This object format can also be used to specify the linter:

```json
{
  "standard-engine": {
    "name": "@novemberborn/as-i-preach"
  }
}
```

### Commands

#### Fix File

Run `Standard Engine: Fix File` to automatically fix linting issues.

#### Restart

Run `Standard Engine: Restart` to clear internal caches and restart linters.

## What about `linter-js-standard`?

If you're using `standard`, `semistandard` or `happiness` then you could use
another package called
[`linter-js-standard`](https://github.com/ricardofbarros/linter-js-standard).

The advantage of using `linter-js-standard-engine` however is that it utilizes
the linter that is installed in your project, rather than bundling a particular
linter version. We also support more linters, including any custom linter that's
based on `standard-engine`.

## License

This module is made public under the ISC License.

See the
[LICENSE](https://github.com/gustavnikolaj/linter-js-standard-engine/blob/master/LICENSE)
file for additional details.
