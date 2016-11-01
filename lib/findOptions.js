var path = require('path')
var readPkgUp = require('read-pkg-up')
var supportedLinters = require('./supportedLinters')

function findOptions (filePath) {
  return readPkgUp({ cwd: path.dirname(filePath) }).then(result => {
    const packageJson = result.pkg
    if (!packageJson) {
      throw new Error('no package.json found')
    }

    var linters = []

    if (packageJson.devDependencies) {
      var lintersFromDeps = Object.keys(packageJson.devDependencies)
        .filter(function (key) {
          return supportedLinters.indexOf(key) !== -1
        })
      linters = linters.concat(lintersFromDeps)
    }

    if (packageJson['standard-engine']) {
      linters.unshift(packageJson['standard-engine'])
    }

    if (linters.length < 1) {
      throw new Error('no supported linter found')
    }

    var linter = linters[0]
    var pathToProject = path.dirname(result.path)

    // Support scoped packages. Assume their `cmd` (and thus options key) is
    // configured as the package name *without* the scope prefix.
    var optionsKey = linter
    if (optionsKey.indexOf('/') !== -1) {
      optionsKey = optionsKey.split('/')[1]
    }

    return {
      linter: linter,
      projectRoot: pathToProject,
      options: packageJson[optionsKey] || {}
    }
  })
}

module.exports = findOptions
