var path = require('path')
var fs = require('fs')

module.exports = function hasPackageJson (dirPath) {
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
