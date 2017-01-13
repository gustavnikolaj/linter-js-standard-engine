const { dirname } = require('path')
const ExtendableError = require('es6-error')
const readPkgUp = require('read-pkg-up')
const supportedLinters = require('./supportedLinters')

class MissingLinterError extends ExtendableError {
  constructor (message = 'no supported linter found') {
    super(message)
  }
}

class MissingPackageError extends ExtendableError {
  constructor (message = 'no package.json found') {
    super(message)
  }
}

function findOptions (file) {
  return readPkgUp({ cwd: dirname(file) })
    .then(({ path, pkg }) => {
      if (!pkg) throw new MissingPackageError()

      let linters = []
      if (pkg.devDependencies) {
        for (const dep of Object.keys(pkg.devDependencies)) {
          if (supportedLinters.includes(dep)) {
            linters.push(dep)
          }
        }
      }
      if (pkg['standard-engine']) {
        linters.unshift(pkg['standard-engine'])
      }

      if (linters.length === 0) {
        throw new MissingLinterError()
      }

      const linterName = linters[0]

      // Support scoped packages. Assume their `cmd` (and thus options key) is
      // configured as the package name *without* the scope prefix.
      let optionsKey = linterName
      if (optionsKey.includes('/')) {
        optionsKey = optionsKey.split('/')[1]
      }

      const options = pkg[optionsKey] || {}
      const { ignore: ignoreGlobs = [] } = options

      return {
        ignoreGlobs,
        linterName,
        projectRoot: dirname(path)
      }
    })
}

exports = module.exports = findOptions

exports.MissingLinterError = MissingLinterError
exports.MissingPackageError = MissingPackageError
