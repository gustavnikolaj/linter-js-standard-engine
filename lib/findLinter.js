var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn

var supportedLinters = require('./supportedLinters')

function hasPackageJson (dirPath) {
  var packageJsonPath = path.resolve(dirPath, 'package.json')
  return new Promise(function (resolve, reject) {
    fs.stat(packageJsonPath, function (err) {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve(false)
        }
        return reject(err)
      }
      return resolve(true)
    })
  })
}

function first (array, predicate) {
  return new Promise(function (resolve, reject) {
    if (array.length > 0) {
      predicate(array[0])
        .then(function (value) {
          if (value) {
            return resolve(array[0])
          } else {
            first(array.slice(1), predicate).then(resolve, reject)
          }
        })
        .catch(reject)
    } else {
      return reject(new Error('No element satisfying predicate.'))
    }
  })
}

function firstPackageJson (filePath) {
  var dirPath = path.dirname(filePath)
  var dirFragments = dirPath.split('/').filter(function (x) { return x.length })
  var possiblePaths = []

  var negativeLength = dirFragments * -1
  for (var i = 0; i < dirFragments.length; i++) {
    possiblePaths.push('/' + dirFragments.slice(negativeLength, dirFragments.length - i).join('/'))
  }

  return first(possiblePaths, hasPackageJson)
}

function readPackageJson (dirPath) {
  return new Promise(function (resolve, reject) {
    var packageJsonPath = path.resolve(dirPath, 'package.json')
    fs.readFile(packageJsonPath, 'utf-8', function (err, data) {
      if (err) {
        return reject(err)
      }
      try {
        resolve(JSON.parse(data))
      } catch (e) {
        reject(e)
      }
    })
  })
}

function getLinterFromPackageJson (dirPath) {
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

      var linterProg = [
        'var buffer = [];',
        "process.stdin.on('data', function (chunk) { buffer.push(chunk); })",
        ".on('end', function () { ",
        "require('{pathToLinter}')",
        '.lintText(Buffer.concat(buffer).toString(),',
        'function (err, result) {',
        'if (err) { console.log("NOTJSON") } else {',
        'console.log(JSON.stringify(result))',
        '}',
        '})});'
      ].join('')

      var pathToLinter = path.resolve(dirPath, 'node_modules', linter)
      try {
        resolve({
          lintText: function (fileContent, cb) {
            var linter = spawn('node', ['-e', linterProg.replace('{pathToLinter}', pathToLinter)])
            linter.on('error', function (err) {
              cb(err)
            })

            var stdout = []
            linter.stdout.on('data', function (chunk) {
              stdout.push(chunk)
            })

            linter.on('close', function () {
              var output = Buffer.concat(stdout).toString()
              var result

              try {
                result = JSON.parse(output)
              } catch (err) {
                console.log('ERROR:', err)
                console.log('when parsing:', output)
                return cb(err)
              }

              cb(null, result)
            })

            linter.stdin.setEncoding('utf-8')
            linter.stdin.write(fileContent)
            linter.stdin.end()
          }
        })
      } catch (err) {
        reject(err)
      }
    })
  }
}

module.exports = function findLinter (filePath) {
  return new Promise(function (resolve, reject) {
    firstPackageJson(filePath)
    .then(function (dirPath) {
      readPackageJson(dirPath)
      .then(getLinterFromPackageJson(dirPath))
      .then(resolve)
    })
    .catch(reject)
  })
}
