const {dirname, join} = require('path')

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

const resolvedPackages = caches.add(new Map())
const computedOptions = caches.add(new Map())

function resolvePackage (dir) {
  if (resolvedPackages.has(dir)) return resolvedPackages.get(dir)

  const promise = findUp('package.json', {cwd: dir}).then(packagePath => {
    if (!packagePath) return null

    return readPkg(packagePath).then(pkg => {
      const stanza = pkg['standard-engine']
      if (stanza && stanza.skip === true) {
        // Resolve a parent `package.json` file instead.
        return resolvePackage(join(dirname(packagePath), '..'))
      }

      return {packagePath, pkg}
    })
  })
  resolvedPackages.set(dir, promise)
  promise.then(packagePath => {
    if (!packagePath && resolvedPackages.get(dir) === promise) {
      resolvedPackages.delete(dir)
    }
  })
  return promise
}

function getOptions ({packagePath, pkg}) {
  if (computedOptions.has(packagePath)) return computedOptions.get(packagePath)

  const stanza = pkg['standard-engine']
  let linterName = !stanza || typeof stanza === 'string'
    ? stanza
    : stanza.name

  // Try to find default linterName
  if (!linterName && pkg.devDependencies) {
    for (const dep of Object.keys(pkg.devDependencies)) {
      if (KNOWN_LINTERS.has(dep)) {
        linterName = dep
        break
      }
    }
  }

  if (!linterName) throw new MissingLinterError()

  // Support scoped packages. Assume their `cmd` (and thus options key) is
  // configured as the package name *without* the scope prefix.
  let optionsKey = linterName
  if (optionsKey.includes('/')) {
    optionsKey = optionsKey.split('/')[1]
  }

  const options = pkg[optionsKey] || {}
  const {ignore: ignoreGlobs = []} = options

  const projectRoot = dirname(packagePath)
  const retval = {ignoreGlobs, linterName, projectRoot}
  computedOptions.set(packagePath, retval)
  return retval
}

function findOptions (file) {
  return resolvePackage(dirname(file))
    .then(resolved => {
      if (!resolved) throw new MissingPackageError()

      return getOptions(resolved)
    })
}

exports = module.exports = findOptions

exports.MissingLinterError = MissingLinterError
exports.MissingPackageError = MissingPackageError
