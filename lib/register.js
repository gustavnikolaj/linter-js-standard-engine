const caches = require('./caches')
const commands = require('./commands')
const lint = require('./lint')
const { GRAMMAR_SCOPES: grammarScopes } = require('./lint')
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
