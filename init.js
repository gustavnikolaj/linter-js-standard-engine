var findOptions = require('./lib/findOptions')
var getLinter = require('./lib/getLinter')
var lint = require('./lib/lint')
var cleanLinters = require('./lib/getLinter').cleanLinters
var minimatch = require('minimatch')
var path = require('path')

module.exports = {
  config: {
    engine: {
      title: 'Linting engine',
      description: 'Which Standard Style engine to use. Choose "custom" to provide your own below. The default, "auto-detect", looks at your package.json to find a compatible linter from this list.',
      type: 'string',
      default: 'auto-detect',
      enum: ['auto-detect', 'standard', 'semistandard', 'happiness', 'onelint', 'uber-standard', 'custom...'],
      order: 1
    },
    customEngine: {
      title: 'Custom linting engine',
      description: 'Which "custom" engine (select above)  to use. Use the name of the package, e.g. "doublestandard" (without the quotes).',
      type: 'string',
      default: '',
      order: 2
    }
  },
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
            var ignoreGlobs = options.options && options.options.ignore || []
            var fileIsIgnored = ignoreGlobs.some(function (pattern) {
              var relativePath = path.relative(options.projectRoot, filePath)
              return minimatch(relativePath, pattern)
            })
            if (fileIsIgnored) {
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
              return []
            }
            var warnings = [
              /incompatible linter/,
              /linter.*not found/
            ]
            var isWarning = warnings.some(function (warning) {
              if (warning.test(err.message)) {
                atom.notifications.addWarning(err.message, {
                  dismissable: true
                })
                return true
              }
            })
            if (!isWarning) {
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
