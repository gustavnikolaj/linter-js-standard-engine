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

function findOptionsByConfig (config, packageJsonPath) {
  switch (config.engine) {
    case 'auto-detect':
      return autodetectOptions(packageJsonPath)
    case 'custom...':
      return readSpecificEngineOptions(config.customEngine, packageJsonPath)
    default:
      return readSpecificEngineOptions(config.engine, packageJsonPath)
  }
}
!
function autodetectOptions (packageJsonPath) {
  return readPackageJson(packageJsonPath)
    .then(function (packageJson) {
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
        throw new Error('no supported linter found')
      }

      var linter = supportedLinterKeys[0]
      var pathToProject = path.dirname(packageJsonPath)

      return {
        linter: linter,
        projectRoot: pathToProject,
        pathToLinter: path.resolve(pathToProject, 'node_modules', linter),
        options: packageJson[linter] || {}
      }
    })
}

function readSpecificEngineOptions (engine, packageJsonPath) {
  return readPackageJson(packageJsonPath)
    .then(function (packageJson) {
      if (!hasDependency(engine, packageJson)) {
        throw new Error('linter "' + engine + '" not found')
      }

      var pathToProject = path.dirname(packageJsonPath)
      var pathToLinter = path.resolve(pathToProject, 'node_modules', engine)

      return {
        linter: engine,
        projectRoot: pathToProject,
        pathToLinter: pathToLinter,
        options: packageJson[engine] || {}
      }
    })
    .then(function (options) {
      var pathToLinterPackageJson = path.resolve(options.pathToLinter, 'package.json')
      return readPackageJson(pathToLinterPackageJson)
        .then(function (linterPackageJson) {
          if (!hasDependency('standard-engine', linterPackageJson)) {
            throw new Error('incompatible linter "' + options.linter + '"')
          }
          return options
        })
    })
}

function hasDependency (dependency, packageJson) {
  var packageDeps = Object.keys(packageJson.dependencies || {})
  var packageDevDeps = Object.keys(packageJson.devDependencies || {})
  packageDeps = packageDeps.concat(packageDevDeps)
  return (packageDeps.indexOf(dependency) !== -1)
}

function readPackageJson (packageJsonPath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(packageJsonPath, function (err, packageJson) {
      if (err) {
        reject(err)
        return
      }
      try {
        resolve(JSON.parse(packageJson))
      } catch (e) {
        e.message = 'Invalid package.json: ' + e.message
        reject(e)
      }
    })
  })
}



module.exports = function findOptions (filePath) {
  return firstPackageJson(filePath)
    .then(function (packageJsonPath) {
      var config = atom.config.get('linter-js-standard-engine')
      return findOptionsByConfig(config, packageJsonPath)
        .catch(function (err) {
          if (err.message === 'no supported linter found') {
            var nextPath = path.dirname(path.dirname(packageJsonPath))
            return findOptions(nextPath)
          }
          throw err
        })
    })
}
