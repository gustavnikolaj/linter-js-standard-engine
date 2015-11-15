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
          return reject(err)
        }

        var msgs = output.results[0].messages
        var occurrences = []

        msgs.forEach(function (msg) {
          occurrences.push({
            type: msg.fatal ? 'Error' : 'Warning',
            text: msg.message,
            filePath: filePath,
            range: getRange(msg.line, msg.column, msg.source)
          })
        })

        return resolve(occurrences)
      })
    })
  }
}
