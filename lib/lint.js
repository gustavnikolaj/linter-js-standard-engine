function getRange (line = 1, column = 1, source = '') {
  const line0 = line - 1
  const column0 = column - 1

  const end = [line0, column0]
  const start = [line0, column0 - source.slice(0, column0).trim().length]
  return [start, end]
}

module.exports = function lint (linter, filePath, fileContent) {
  return linter.lintText(filePath, fileContent)
    .then(([{ messages } = {}]) => {
      if (!Array.isArray(messages)) throw new Error('invalid lint report')

      return messages.map(({ fatal, message: text, line, column, source }) => ({
        type: fatal ? 'Error' : 'Warning',
        text,
        filePath,
        range: getRange(line, column, source)
      }))
    })
}
