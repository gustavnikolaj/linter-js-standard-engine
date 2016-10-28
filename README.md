# linter-js-standard-engine

[![Build Status](https://travis-ci.org/gustavnikolaj/linter-js-standard-engine.svg?branch=master)](https://travis-ci.org/gustavnikolaj/linter-js-standard-engine)

A linter for GitHub's [Atom Editor](https://atom.io) using the
[Linter Plugin](https://github.com/atom-community/linter), for use with the
[standard](https://github.com/feross/standard) linter, and other linters based
on [standard-engine](https://github.com/flet/standard-engine).

There's already another plugin, doing almost the same thing, called
[linter-js-standard](https://github.com/ricardofbarros/linter-js-standard). The
reason why I chose to roll my own, was that I disagreed with the approach it
took. The existing tool ships with some of the standard-engine based linters
already installed.

Rather than doing that, linter-js-standard-engine will look for any linters in
the list of
[supported linters](https://github.com/gustavnikolaj/linter-js-standard-engine/blob/master/lib/supportedLinters.js)
and go look for the nearest package.json file, and check if any of those linters
are in use.

That allows the plugin to offer a smooth and zero-configuration experience and a
smaller footprint.

Any configuration you have for your existing linter will be picked up, as the
plugin will spawn a child process running your linter in a context similar to
what it would have on the command line.

## License

This module is made public under the ISC License.

See the [LICENSE](https://github.com/gustavnikolaj/linter-js-standard-engine/blob/master/LICENSE)
file for additional details.
