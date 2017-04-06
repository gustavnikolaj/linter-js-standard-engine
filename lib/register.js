const caches = require('./caches')
const commands = require('./commands')
const { GRAMMAR_SCOPES } = require('./constants')
const reportError = require('./reportError')

const commandDisposable = atom.commands.add('atom-workspace', commands)

let lint = (...args) => {
  const { lint: loaded } = require('./linting')
  lint = loaded
  return loaded(...args)
}

exports.deactivate = () => {
  caches.clearAll()
  commandDisposable.dispose()
}

exports.provideLinter = () => ({
  name: 'standard-engine',
  grammarScopes: GRAMMAR_SCOPES,
  scope: 'file',
  lintsOnChange: true,
  lint (textEditor) {
    return lint(textEditor, reportError)
  }
})
