const caches = require('./caches')
const fix = require('./fix')
const reportError = require('./reportError')

module.exports = {
  'Standard Engine:Fix File' () {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) fix(editor, reportError)
  },

  'Standard Engine:Restart' () {
    caches.clearAll()
  }
}
