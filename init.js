const findOptions = require('./lib/findOptions')
const getLinter = require('./lib/getLinter')
const perform = require('./lib/lint')
const cleanLinters = require('./lib/getLinter').cleanLinters
const minimatch = require('minimatch')
const { relative } = require('path')

function suppressError (err) {
  return [
    'no supported linter found',
    'no package.json found'
  ].some(pattern => {
    return pattern === err.message
  })
}

function lint (textEditor) {
  const { scopeName } = textEditor.getGrammar()
  if (!this.grammarScopes.includes(scopeName)) return Promise.resolve([])

  // Get text at the time the linter was invoked.
  const text = textEditor.getText()
  const path = textEditor.getPath()

  return findOptions(path)
    .then(({ linterName, projectRoot, ignoreGlobs }) => {
      const relativePath = relative(projectRoot, path)
      const fileIsIgnored = ignoreGlobs.some(pattern => minimatch(relativePath, pattern))
      if (fileIsIgnored) return [] // No errors

      const linter = getLinter(linterName, projectRoot)
      return perform(linter, path, text)
    })
    .catch(err => {
      if (!suppressError(err)) {
        atom.notifications.addError(err.message || 'Something bad happened', {
          error: err,
          detail: err.stack,
          dismissable: true
        })
      }

      return []
    })
}

exports.deactivate = () => {
  cleanLinters()
}

exports.provideLinter = () => ({
  name: 'standard-engine',
  grammarScopes: ['source.js', 'source.js.jsx'],
  scope: 'file',
  lintOnFly: true,
  lint
})
