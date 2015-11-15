var findFirstPackageJson = require('./findFirstPackageJson')
var readPackageJson = require('./readPackageJson')
var getLinterFromPackageJson = require('./getLinterFromPackageJson')

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
