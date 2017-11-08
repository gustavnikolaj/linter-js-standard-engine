const caches = require('./caches')
const commands = require('./commands')
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
  },
  grammarScopes: {
    title: 'Scopes',
    description: 'Grammar scopes for which linting is enabled. Reload window for changes to take effect.',
    type: 'array',
    default: ['source.js', 'source.js.jsx'],
    items: {
      type: 'string'
    }
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
  grammarScopes: atom.config.get('linter-js-standard-engine.grammarScopes'),
  scope: 'file',
  lintsOnChange: true,
  lint (textEditor) {
    return lint(textEditor, reportError)
  }
})

exports.serialize = () => ({ optIn: optInManager.serialize() })
