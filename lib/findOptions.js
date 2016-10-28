var path = require('path')
var fs = require('fs')
var supportedLinters = require('./supportedLinters')

function firstPackageJson (filePath) {
  var dirName = path.dirname(filePath)
  return new Promise(function (resolve, reject) {
    if (filePath === dirName) {
      return reject(new Error('no package.json found'))
    }
    var packageJsonPath = path.resolve(dirName, 'package.json')
    fs.stat(packageJsonPath, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return firstPackageJson(dirName).then(resolve, reject)
        } else {
          return reject(err)
        }
      }
      return resolve(packageJsonPath)
    })
  })
}

function readOptionsFromPackageJson (packageJsonPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(packageJsonPath, function (err, packageJson) {
      if (err) {
        reject(err)
      }
      try {
        packageJson = JSON.parse(packageJson)
      } catch (e) {
        e.message = 'Invalid package.json: ' + e.message
        reject(e)
      }

      var linters = Object.keys(packageJson).filter(function (key) {
        return supportedLinters.indexOf(key) !== -1
      })

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
        return reject(new Error('no supported linter found'))
      }

      var linter = linters[0]
      var pathToProject = path.dirname(packageJsonPath)

      // Support scoped packages. Assume their `cmd` (and thus options key) is
      // configured as the package name *without* the scope prefix.
      var optionsKey = linter
      if (optionsKey.indexOf('/') !== -1) {
        optionsKey = optionsKey.split('/')[1]
      }

      resolve({
        linter: linter,
        projectRoot: pathToProject,
        options: packageJson[optionsKey] || {}
      })
    })
  })
}

module.exports = function findOptions (filePath) {
  return firstPackageJson(filePath)
    .then(function (packageJsonPath) {
      return readOptionsFromPackageJson(packageJsonPath)
    })
}
