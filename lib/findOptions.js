const path = require('path')
const readPkgUp = require('read-pkg-up')
const supportedLinters = require('./supportedLinters')

function findOptions (filePath) {
  return readPkgUp({ cwd: path.dirname(filePath) }).then(result => {
    const packageJson = result.pkg
    if (!packageJson) {
      throw new Error('no package.json found')
    }

    let linters = []

    if (packageJson.devDependencies) {
      const lintersFromDeps = Object.keys(packageJson.devDependencies)
        .filter(key => supportedLinters.includes(key))
      linters = linters.concat(lintersFromDeps)
    }

    if (packageJson['standard-engine']) {
      linters.unshift(packageJson['standard-engine'])
    }

    if (linters.length < 1) {
      throw new Error('no supported linter found')
    }

    const linter = linters[0]
    const pathToProject = path.dirname(result.path)

    // Support scoped packages. Assume their `cmd` (and thus options key) is
    // configured as the package name *without* the scope prefix.
    let optionsKey = linter
    if (optionsKey.includes('/')) {
      optionsKey = optionsKey.split('/')[1]
    }

    return {
      linter,
      projectRoot: pathToProject,
      options: packageJson[optionsKey] || {}
    }
  })
}

module.exports = findOptions
