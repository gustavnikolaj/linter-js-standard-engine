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

      var supportedLinterKeys = Object.keys(packageJson).filter(function (key) {
        return supportedLinters.indexOf(key) !== -1
      })

      if (packageJson.devDependencies) {
        var lintersFromDeps = Object.keys(packageJson.devDependencies)
          .filter(function (key) {
            return supportedLinters.indexOf(key) !== -1
          })
        supportedLinterKeys = supportedLinterKeys.concat(lintersFromDeps)
      }

      if (supportedLinterKeys.length < 1) {
        return reject(new Error('no supported linter found'))
      }

      var linter = supportedLinterKeys[0]
      var pathToProject = path.dirname(packageJsonPath)

      resolve({
        linter: linter,
        projectRoot: pathToProject,
        pathToLinter: path.resolve(pathToProject, 'node_modules', linter),
        options: packageJson[linter] || {}
      })
    })
  })
}

module.exports = function findOptions (filePath) {
  return firstPackageJson(filePath)
    .then(function (packageJsonPath) {
      return readOptionsFromPackageJson(packageJsonPath)
        .catch(function (err) {
          if (err.message === 'no supported linter found') {
            var nextPath = path.dirname(path.dirname(packageJsonPath))
            return findOptions(nextPath)
          }
          throw err
        })
    })
}
