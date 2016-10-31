function getRange (line, col, src) {
  line = typeof line !== 'undefined' ? parseInt((line - 1), 10) : 0
  col = typeof col !== 'undefined' ? parseInt(col - 1, 10) : 0
  src = src || ''
  src = src.substring(0, col)

  return [[line, col - src.trim().length], [line, col]]
}

module.exports = function lint (filePath, fileContent) {
  return function (linter) {
    return new Promise(function (resolve, reject) {
      linter.lintText(fileContent, function (err, output) {
        if (err) {
          if (typeof err === 'string') {
            err = new Error(err)
          }
          return reject(err)
        }

        var results = output && output.results && output.results[0]
        var messages = results && results.messages

        if (!Array.isArray(messages)) {
          return reject(new Error('invalid lint report'))
        }

        resolve(messages.map(function (msg) {
          return {
            type: msg.fatal ? 'Error' : 'Warning',
            text: msg.message,
            filePath: filePath,
            range: getRange(msg.line, msg.column, msg.source)
          }
        }))
      })
    })
  }
}
