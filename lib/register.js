const lint = require('./lint')
const { GRAMMAR_SCOPES: grammarScopes } = require('./lint')
const cleanLinters = require('./getLinter').cleanLinters

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
