var resolveCwd = require('resolve-cwd')

var linterName = process.argv[2]

function generateFakeLintResult (msg) {
  return { results: [ { messages: [ { message: msg, fatal: true } ] } ] }
}

var linterInstance = null
function getLinter () {
  if (linterInstance) {
    return linterInstance
  }

  var linterPath = resolveCwd(linterName)
  if (linterPath) {
    try {
      linterInstance = require(linterPath)
    } catch (err) {
      linterInstance = {
        lintText (source, callback) {
          callback(err)
        }
      }
    }
  } else {
    linterInstance = {
      lintText (source, callback) {
        return callback(null, generateFakeLintResult('Could not load linter "' + linterName + '"'))
      }
    }
  }

  return linterInstance
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
