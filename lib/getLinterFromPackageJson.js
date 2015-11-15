var path = require('path')
var getLinter = require('./getLinter')
var supportedLinters = require('./supportedLinters')

module.exports = function getLinterFromPackageJson (dirPath) {
  return function (packageJson) {
    return new Promise(function (resolve, reject) {
      var devDeps = Object.keys(packageJson.devDependencies)
      var linter = false

      supportedLinters.some(function (supportedLinter) {
        if (devDeps.indexOf(supportedLinter) !== -1) {
          linter = supportedLinter
          return true
        }
      })

      if (!linter) {
        reject() // TODO how to handle cases with no available linter?
      }

      var pathToLinter = path.resolve(dirPath, 'node_modules', linter)
      getLinter(pathToLinter).then(resolve, reject)
    })
  }
}
