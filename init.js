const findOptions = require('./lib/findOptions')
const getLinter = require('./lib/getLinter')
const lint = require('./lib/lint')
const cleanLinters = require('./lib/getLinter').cleanLinters
const minimatch = require('minimatch')
const path = require('path')

function suppressError (err) {
  return [
    'no supported linter found',
    'no package.json found',
    /^Could not load linter "/
  ].some(pattern => {
    if (typeof pattern === 'string') {
      return pattern === err.message
    }
    // istanbul ignore else
    if (pattern instanceof RegExp) {
      return pattern.test(err.message)
    }
  })
}

module.exports = {
  deactivate () {
    cleanLinters()
  },
  provideLinter () {
    return {
      name: 'lint',
      grammarScopes: ['source.js', 'source.js.jsx'],
      scope: 'file',
      lintOnFly: true,
      lint (textEditor) {
        const fileContent = textEditor.getText()
        const filePath = textEditor.getPath()
        const fileScope = textEditor.getGrammar().scopeName

        if (!this.grammarScopes.includes(fileScope)) {
          return Promise.resolve([])
        }

        return findOptions(filePath)
          .then(options => {
            const ignoreGlobs = options.options && options.options.ignore || []
            const fileIsIgnored = ignoreGlobs.some(pattern => {
              const relativePath = path.relative(options.projectRoot, filePath)
              return minimatch(relativePath, pattern)
            })
            if (fileIsIgnored) {
              return [] // No errors
            }
            return getLinter(options.linter, options.projectRoot)
              .then(lint(filePath, fileContent))
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
    }
  }
}
