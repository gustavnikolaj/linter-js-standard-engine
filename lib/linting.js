const { relative } = require('path')

const ExtendableError = require('es6-error')
const minimatch = require('minimatch')

const { GRAMMAR_SCOPES } = require('./constants')
const findOptions = require('./findOptions')
const { getWorker } = require('./workerManagement')

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

class InvalidReportError extends ExtendableError {
  constructor (message = 'Invalid lint report') {
    super(message)
  }
}

function getReport (textEditor, fix) {
  const { scopeName } = textEditor.getGrammar()
  if (!GRAMMAR_SCOPES.includes(scopeName)) return Promise.resolve(null)

  // Get text at the time the linter was invoked.
  const fileContent = textEditor.getText()
  const filePath = textEditor.getPath()

  return findOptions(filePath)
    .then(({ linterName, projectRoot, ignoreGlobs }) => {
      const relativePath = relative(projectRoot, filePath)
      const fileIsIgnored = ignoreGlobs.some(pattern => minimatch(relativePath, pattern))
      if (fileIsIgnored) return null

      const worker = getWorker(linterName, projectRoot)
      return worker.lint(filePath, fileContent, fix)
        .then(([{ messages, output } = {}]) => {
          if (!Array.isArray(messages)) throw new InvalidReportError()
          return { filePath, messages, output }
        })
    })
}

function fix (textEditor, reportError) {
  return getReport(textEditor, true)
    .then(report => report && report.output)
    .catch(err => {
      if (!suppressError(err)) reportError(err)

      return null
    })
}

function lint (textEditor, reportError) {
  return getReport(textEditor, false)
    .then(report => {
      if (!report) return []

      const { filePath } = report
      return report.messages.map(({ message: excerpt, line, column, severity, source }) => ({
        severity: severity === 2 ? 'error' : 'warning',
        excerpt,
        location: {
          file: filePath,
          position: getRange(line, column, source)
        }
      }))
    })
    .catch(err => {
      if (!suppressError(err)) reportError(err)

      return []
    })
}

exports.fix = fix
exports.lint = lint
