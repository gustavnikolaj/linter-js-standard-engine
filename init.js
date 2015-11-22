var findOptions = require('./lib/findOptions')
var getLinter = require('./lib/getLinter')
var lint = require('./lib/lint')
var cleanLinters = require('./lib/getLinter').cleanLinters
var minimatch = require('minimatch')
var path = require('path')

module.exports = {
  deactivate: function () {
    cleanLinters()
  },
  provideLinter: function () {
    return {
      name: 'lint',
      grammarScopes: ['source.js', 'source.js.jsx'],
      scope: 'file',
      lintOnFly: true,
      lint: function (textEditor) {
        var fileContent = textEditor.getText()
        var filePath = textEditor.getPath()
        var fileScope = textEditor.getGrammar().scopeName

        if (this.grammarScopes.indexOf(fileScope) < 0) {
          return []
        }

        return findOptions(filePath)
          .then(function (options) {
            if (options.options && options.options.ignore && options.options.ignore.some(function (pattern) {
              var relativePath = path.relative(options.projectRoot, filePath)
              return minimatch(relativePath, pattern)
            })) {
              return [] // No errors
            }
            return getLinter(options.pathToLinter)
              .then(lint(filePath, fileContent))
          })
          .catch(function (err) {
            var suppressedErrorMessages = [
              'no supported linter found',
              'no package.json found'
            ]
            if (suppressedErrorMessages.indexOf(err.message) !== -1) {
              atom.notifications.addError('Something bad happened', {
                error: err,
                detail: err.stack,
                dismissable: true
              })
            }
            return []
          })
      }
    }
  }
}
