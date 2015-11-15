var path = require('path')
var fs = require('fs')

module.exports = function readPackageJson (dirPath) {
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
