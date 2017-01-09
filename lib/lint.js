function getRange (line, col, src) {
  line = typeof line !== 'undefined' ? parseInt((line - 1), 10) : 0
  col = typeof col !== 'undefined' ? parseInt(col - 1, 10) : 0
  src = src || ''
  src = src.substring(0, col)

  return [[line, col - src.trim().length], [line, col]]
}

module.exports = function lint (filePath, fileContent) {
  return linter => new Promise((resolve, reject) => {
    linter.lintText(filePath, fileContent, (err, output) => {
      if (err) {
        if (typeof err === 'string') {
          err = new Error(err)
        }
        return reject(err)
      }

      const results = output && output.results && output.results[0]
      const messages = results && results.messages

      if (!Array.isArray(messages)) {
        return reject(new Error('invalid lint report'))
      }

      resolve(messages.map(msg => ({
        type: msg.fatal ? 'Error' : 'Warning',
        text: msg.message,
        filePath,
        range: getRange(msg.line, msg.column, msg.source)
      })))
    })
  })
}
