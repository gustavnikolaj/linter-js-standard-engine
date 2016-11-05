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

function getCallbackOnce (pending, id) {
  const callback = pending.get(id)
  pending.delete(id)
  return callback
}

var createLinter = function (linterName, projectRoot) {
  var child = fork(lintWorkerPath, [ linterName ], {
    cwd: projectRoot
  })
  var sequenceNumber = 0
  var pendingCallbacks = new Map()

  child.on('message', function (data) {
    var callback = getCallbackOnce(pendingCallbacks, data.id)
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
      pendingCallbacks.set(id, cb)

      child.send({
        id: id,
        source: fileContent
      })
    },
    shutdown: function () {
      // Shutdown is optimistic, but may be called when the linter is
      // intentionally removed from the cache. Ignore any errors thrown.
      try {
        child.disconnect()
      } catch (err) {}
    },
    exited: new Promise(resolve => {
      child.once('exit', resolve)
    })
  }
}

module.exports = function getLinter (linterName, projectRoot) {
  return new Promise(function (resolve, reject) {
    var cacheKey = linterName + '\n' + projectRoot
    var linter = linters.get(cacheKey)

    if (!linter) {
      linter = createLinter(linterName, projectRoot)
      linters.set(cacheKey, linter)
      linter.exited.then(() => {
        // A new linter may have been created in the meantime, make sure not to
        // delete that one.
        if (linters.peek(cacheKey) === linter) {
          linters.del(cacheKey)
        }
      })
    }

    resolve(linter)
  })
}

module.exports.cleanLinters = function () {
  linters.reset()
}
