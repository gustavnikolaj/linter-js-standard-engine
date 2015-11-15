var path = require('path')
var hasPackageJson = require('./hasPackageJson')
var first = require('./first')

module.exports = function findFirstPackageJson (filePath) {
  var dirPath = path.dirname(filePath)
  var dirFragments = dirPath.split('/').filter(function (x) { return x.length })
  var possiblePaths = []

  var negativeLength = dirFragments * -1
  for (var i = 0; i < dirFragments.length; i++) {
    possiblePaths.push('/' + dirFragments.slice(negativeLength, dirFragments.length - i).join('/'))
  }

  return first(possiblePaths, hasPackageJson)
}
