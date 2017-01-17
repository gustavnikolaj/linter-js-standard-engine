const caches = require('./caches')
const reportError = require('./reportError')

let fix = (...args) => {
  const loaded = require('./fix')
  fix = loaded
  return loaded(...args)
}

module.exports = {
  'Standard Engine:Fix File' () {
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) fix(editor, reportError)
  },

  'Standard Engine:Restart' () {
    caches.clearAll()
  }
}
