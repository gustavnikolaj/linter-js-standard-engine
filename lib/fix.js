const { fix: getOutput } = require('./linting')

function fix (textEditor, reportError) {
  return getOutput(textEditor, reportError)
    .then(output => {
      if (output) textEditor.getBuffer().setTextViaDiff(output)
    })
}

module.exports = fix
