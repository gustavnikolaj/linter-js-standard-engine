module.exports = function textEditorFactory (input) {
  input = input || {}
  if (typeof input === 'string') {
    input = {
      source: input
    }
  }
  return {
    getText: function () {
      return input.source || ''
    },
    getPath: function () {
      return input.path || __dirname + '/foo.js' // standard devDep will be found
    },
    getGrammar: function () {
      return {
        scopeName: input.scopeName || 'source.js'
      }
    }
  }
}
