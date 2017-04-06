const path = require('path')

module.exports = function textEditorFactory (input = {}) {
  if (typeof input === 'string') {
    input = {
      source: input
    }
  }
  return {
    getText () {
      return input.source || ''
    },
    getBuffer () {
      return {
        positionForCharacterIndex (x) {
          // This method is supposed to return the position as an array
          // [line, column] as zero indexed numbers. For now it is just stubbed
          // out.
          return [0, 0]
        }
      }
    },
    getPath () {
      return input.path || path.resolve(__dirname, 'foo.js') // standard devDep will be found
    },
    getGrammar () {
      return {
        scopeName: input.scopeName || 'source.js'
      }
    }
  }
}
