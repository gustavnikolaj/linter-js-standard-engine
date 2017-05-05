const { dirname } = require('path')

const ExtendableError = require('es6-error')
const findUp = require('find-up')
const readPkg = require('read-pkg')

const caches = require('./caches')

const KNOWN_LINTERS = new Set([
  'happiness',
  'onelint',
  'semistandard',
  'standard',
  'uber-standard'
])

class MissingLinterError extends ExtendableError {
  constructor (message = 'No supported linter found') {
    super(message)
  }
}

class MissingPackageError extends ExtendableError {
  constructor (message = 'No package.json found') {
    super(message)
  }
}

const packagePaths = caches.add(new Map())
const options = caches.add(new Map())

function getPackagePath (file) {
  const cwd = dirname(file)
  if (packagePaths.has(cwd)) return packagePaths.get(cwd)

  const promise = findUp('package.json', { cwd })
  packagePaths.set(cwd, promise)
  promise.then(packagePath => {
    if (!packagePath && packagePaths.get(cwd) === promise) {
      packagePaths.delete(cwd)
    }
  })
  return promise
}

function getOptions (packagePath) {
  if (options.has(packagePath)) return options.get(packagePath)

  const promise = (packagePath && readPkg(packagePath) || Promise.resolve(null))
    .then(pkg => {
      if (!pkg) throw new MissingPackageError()
      const standardEngineConfiguration = {}

      // Parse standard-engine configuration
      if (pkg['standard-engine']) {
        if (typeof pkg['standard-engine'] === 'string') {
          standardEngineConfiguration.linterName = pkg['standard-engine']
        }

        const isSkip = pkg['standard-engine'].skipPackageJson
        standardEngineConfiguration.skipPackageJson = (isSkip || false)
      }

      // Try to find another package.json up the tree
      if (standardEngineConfiguration.skipPackageJson) {
        return getPackagePath(dirname(packagePath)).then(getOptions)
      }

      // Try to find default linterName
      if (!standardEngineConfiguration.linterName) {
        if (pkg.devDependencies) {
          for (const dep of Object.keys(pkg.devDependencies)) {
            if (KNOWN_LINTERS.has(dep)) {
              standardEngineConfiguration.linterName = dep
              break
            }
          }
        }
      }

      if (!standardEngineConfiguration.linterName) {
        throw new MissingLinterError()
      }

      // Support scoped packages. Assume their `cmd` (and thus options key) is
      // configured as the package name *without* the scope prefix.
      let optionsKey = standardEngineConfiguration.linterName
      if (optionsKey.includes('/')) {
        optionsKey = optionsKey.split('/')[1]
      }

      const options = pkg[optionsKey] || {}
      const { ignore: ignoreGlobs = [] } = options

      return {
        ignoreGlobs,
        linterName: standardEngineConfiguration.linterName,
        projectRoot: dirname(packagePath)
      }
    })
  options.set(packagePath, promise)
  promise.catch(() => options.delete(packagePath))
  return promise
}

function findOptions (file) {
  return getPackagePath(file).then(getOptions)
}

exports = module.exports = findOptions

exports.MissingLinterError = MissingLinterError
exports.MissingPackageError = MissingPackageError
