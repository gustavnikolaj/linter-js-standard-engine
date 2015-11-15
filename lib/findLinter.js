var path = require('path')
var spawn = require('child_process').spawn

var supportedLinters = require('./supportedLinters')
var findFirstPackageJson = require('./findFirstPackageJson')
var readPackageJson = require('./readPackageJson')

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
    findFirstPackageJson(filePath)
    .then(function (dirPath) {
      readPackageJson(dirPath)
      .then(getLinterFromPackageJson(dirPath))
      .then(resolve)
    })
    .catch(reject)
  })
}
