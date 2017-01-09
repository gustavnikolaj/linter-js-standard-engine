const { dirname } = require('path')
const readPkgUp = require('read-pkg-up')
const supportedLinters = require('./supportedLinters')

function findOptions (file) {
  return readPkgUp({ cwd: dirname(file) })
    .then(({ path, pkg }) => {
      if (!pkg) throw new Error('no package.json found')

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
        throw new Error('no supported linter found')
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

module.exports = findOptions
