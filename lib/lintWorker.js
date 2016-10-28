var linterName = process.argv[2]

var linterInstance = null
function getLinter () {
  if (linterInstance) {
    return linterInstance
  }

  try {
    linterInstance = require(linterName)
    return linterInstance
  } catch (e) {
    return {
      lintText: function (source, callback) {
        callback('Could not load linter "' + linterName + '"')
      }
    }
  }
}

process.on('message', function (data) {
  getLinter().lintText(data.source, function (err, result) {
    process.send({
      id: data.id,
      source: data.source,
      result: result || null,
      err: err
    })
  })
})
