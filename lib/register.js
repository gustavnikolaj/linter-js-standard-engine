const caches = require('./caches')
const lint = require('./lint')
const { GRAMMAR_SCOPES: grammarScopes } = require('./lint')

exports.deactivate = () => {
  caches.clearAll()
}

exports.provideLinter = () => ({
  name: 'standard-engine',
  grammarScopes,
  scope: 'file',
  lintOnFly: true,
  lint
})
