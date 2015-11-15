var fork = require('child_process').fork
var path = require('path')
var lruCache = require('lru-cache')

var linters = lruCache({
  max: 2,
  dispose: function (pathToLinter, linter) {
    linter.shutdown()
  }
})

var lintWorkerPath = path.resolve(__dirname, 'lintWorker.js')

var createLinter = function (pathToLinter) {
  var child = fork(lintWorkerPath, [ pathToLinter ])
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
      id++
      var id = sequenceNumber
      pendingCallbacks[id] = cb

      child.send({
        id: id,
        source: fileContent
      })
    },
    shutdown: function () {
      linters.delete(pathToLinter)
      child.disconnect()
    }
  }
}

module.exports = function getLinter (pathToLinter) {
  return new Promise(function (resolve, reject) {
    var linter = linters.get(pathToLinter)

    if (!linter) {
      linter = createLinter(pathToLinter)
      linters.set(pathToLinter, linter)
    }

    resolve(linter)
  })
}
