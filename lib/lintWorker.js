var linterName = process.argv[2]

function generateFakeLintResult (msg) {
  return { results: [ { messages: [ { message: msg, fatal: true } ] } ] }
}

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
        if (e.code === 'MODULE_NOT_FOUND') {
          var message = 'Could not load linter "' + linterName + '"'
          return callback(null, generateFakeLintResult(message))
        }
        callback(e.stack || e.message)
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
