var findLinter = require('./lib/findLinter')
var lint = require('./lib/lint')
var cleanLinters = require('./lib/getLinter').cleanLinters

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

        return findLinter(filePath)
          .then(lint(filePath, fileContent))
          .catch(function (err) {
            return atom.notifications.addError('Something bad happened', {
              error: err,
              detail: err.stack,
              dismissable: true
            })
          })
      }
    }
  }
}
