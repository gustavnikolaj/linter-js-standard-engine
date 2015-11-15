var findLinter = require('./findLinter')
var lint = require('./lint')

module.exports = function generateLintPromise (filePath, fileContent) {
  return new Promise(function (resolve, reject) {
    findLinter(filePath)
      .then(lint(filePath, fileContent))
      .then(resolve, reject)
  })
}
