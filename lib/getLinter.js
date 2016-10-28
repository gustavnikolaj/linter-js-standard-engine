var fork = require('child_process').fork
var path = require('path')
var lruCache = require('lru-cache')

var linters = lruCache({
  max: 2,
  dispose: function (cacheKey, linter) {
    linter.shutdown()
  }
})

var lintWorkerPath = path.resolve(__dirname, 'lintWorker.js')

var createLinter = function (linterName, projectRoot) {
  var child = fork(lintWorkerPath, [ linterName ], {
    cwd: projectRoot
  })
  var sequenceNumber = 0
  var pendingCallbacks = {}

  child.on('message', function (data) {
    var callback = pendingCallbacks[data.id]
    if (callback) {
      if (data.err) {
        return callback(data.err)
      } else {
        return callback(null, data.result)
      }
    }
  })

  return {
    lintText: function (fileContent, cb) {
      sequenceNumber++
      var id = sequenceNumber
      pendingCallbacks[id] = cb

      child.send({
        id: id,
        source: fileContent
      })
    },
    shutdown: function () {
      child.disconnect()
    }
  }
}

module.exports = function getLinter (linterName, projectRoot) {
  return new Promise(function (resolve, reject) {
    var cacheKey = linterName + '\n' + projectRoot
    var linter = linters.get(cacheKey)

    if (!linter) {
      linter = createLinter(linterName, projectRoot)
      linters.set(cacheKey, linter)
    }

    resolve(linter)
  })
}

module.exports.cleanLinters = function () {
  linters.reset()
}
