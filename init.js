var findOptions = require('./lib/findOptions')
var getLinter = require('./lib/getLinter')
var lint = require('./lib/lint')
var cleanLinters = require('./lib/getLinter').cleanLinters
var minimatch = require('minimatch')
var path = require('path')

function suppressError (err) {
  return [
    'no supported linter found',
    'no package.json found',
    /^Could not load linter "/
  ].some(function (pattern) {
    if (typeof pattern === 'string') {
      return pattern === err.message
    }
    // istanbul ignore else
    if (pattern instanceof RegExp) {
      return pattern.test(err.message)
    }
  })
}

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
          return Promise.resolve([])
        }

        return findOptions(filePath)
          .then(function (options) {
            var ignoreGlobs = options.options && options.options.ignore || []
            var fileIsIgnored = ignoreGlobs.some(function (pattern) {
              var relativePath = path.relative(options.projectRoot, filePath)
              return minimatch(relativePath, pattern)
            })
            if (fileIsIgnored) {
              return [] // No errors
            }
            return getLinter(options.linter, options.projectRoot)
              .then(lint(filePath, fileContent))
          })
          .catch(function (err) {
            if (!suppressError(err)) {
              atom.notifications.addError(err.message || 'Something bad happened', {
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
