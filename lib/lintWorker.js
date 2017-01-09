const resolveCwd = require('resolve-cwd')

const linterName = process.argv[2]

function generateFakeLintResult (msg) {
  return { results: [ { messages: [ { message: msg, fatal: true } ] } ] }
}

let linterInstance = null
function getLinter () {
  if (linterInstance) {
    return linterInstance
  }

  const linterPath = resolveCwd(linterName)
  if (linterPath) {
    try {
      linterInstance = require(linterPath)
    } catch (err) {
      linterInstance = {
        lintText (source, opts, callback) {
          callback(err)
        }
      }
    }
  } else {
    linterInstance = {
      lintText (source, opts, callback) {
        return callback(null, generateFakeLintResult(`Could not load linter "${linterName}"`))
      }
    }
  }

  return linterInstance
}

process.on('message', data => {
  const cb = (err, result = null) => {
    process.send({
      id: data.id,
      source: data.source,
      result,
      err
    })
  }

  try {
    getLinter().lintText(data.source, { filename: data.filename }, cb)
  } catch (err) {
    cb(err)
  }
})
