const caches = require('./caches')
const commands = require('./commands')
const { GRAMMAR_SCOPES: grammarScopes, lint } = require('./linting')
const reportError = require('./reportError')

const commandDisposable = atom.commands.add('atom-workspace', commands)

exports.deactivate = () => {
  caches.clearAll()
  commandDisposable.dispose()
}

exports.provideLinter = () => ({
  name: 'standard-engine',
  grammarScopes,
  scope: 'file',
  lintOnFly: true,
  lint (textEditor) {
    return lint(textEditor, reportError)
  }
})
