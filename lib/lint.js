const { relative } = require('path')
const minimatch = require('minimatch')

const findOptions = require('./findOptions')
const getLinter = require('./getLinter')

function getRange (line = 1, column = 1, source = '') {
  const line0 = line - 1
  const column0 = column - 1

  const end = [line0, column0]
  const start = [line0, column0 - source.slice(0, column0).trim().length]
  return [start, end]
}

function suppressError (err) {
  return err.name === 'MissingLinterError' || err.name === 'MissingPackageError'
}

const GRAMMAR_SCOPES = ['source.js', 'source.js.jsx']

function lint (textEditor, reportError) {
  const { scopeName } = textEditor.getGrammar()
  if (!GRAMMAR_SCOPES.includes(scopeName)) return Promise.resolve([])

  // Get text at the time the linter was invoked.
  const fileContent = textEditor.getText()
  const filePath = textEditor.getPath()

  return findOptions(filePath)
    .then(({ linterName, projectRoot, ignoreGlobs }) => {
      const relativePath = relative(projectRoot, filePath)
      const fileIsIgnored = ignoreGlobs.some(pattern => minimatch(relativePath, pattern))
      if (fileIsIgnored) return [] // No errors

      const linter = getLinter(linterName, projectRoot)
      return linter.lintText(filePath, fileContent)
        .then(([{ messages } = {}]) => {
          if (!Array.isArray(messages)) throw new Error('Invalid lint report')

          return messages.map(({ fatal, message: text, line, column, source }) => ({
            type: fatal ? 'Error' : 'Warning',
            text,
            filePath,
            range: getRange(line, column, source)
          }))
        })
    })
    .catch(err => {
      if (!suppressError(err)) reportError(err)

      return []
    })
}

exports = module.exports = lint
exports.GRAMMAR_SCOPES = GRAMMAR_SCOPES
