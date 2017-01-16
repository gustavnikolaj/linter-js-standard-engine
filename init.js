const lint = require('./lib/lint')
const { GRAMMAR_SCOPES: grammarScopes } = require('./lib/lint')
const cleanLinters = require('./lib/getLinter').cleanLinters

exports.deactivate = () => {
  cleanLinters()
}

exports.provideLinter = () => ({
  name: 'standard-engine',
  grammarScopes,
  scope: 'file',
  lintOnFly: true,
  lint
})
