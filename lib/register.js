const caches = require('./caches')
const commands = require('./commands')
const { GRAMMAR_SCOPES } = require('./constants')
const optInManager = require('./optInManager')
const reportError = require('./reportError')

const commandDisposable = atom.commands.add('atom-workspace', commands)

let lint = (...args) => {
  const { lint: loaded } = require('./linting')
  lint = loaded
  return loaded(...args)
}

exports.config = {
  enabledProjects: {
    title: 'Enable',
    description: 'Control whether linting should be enabled manually, for each project, or is enabled for all projects.',
    type: 'number',
    default: optInManager.SOME,
    enum: [
      {value: optInManager.NONE, description: 'Reset existing permissions'},
      {value: optInManager.SOME, description: 'Decide for each project'},
      {value: optInManager.ALL, description: 'Enable for all projects'}
    ]
  }
}

exports.activate = state => {
  optInManager.activate(state && state.optIn)
}

exports.deactivate = () => {
  caches.clearAll()
  commandDisposable.dispose()
  optInManager.deactivate()
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

exports.serialize = () => ({ optIn: optInManager.serialize() })
