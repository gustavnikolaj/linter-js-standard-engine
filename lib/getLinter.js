const { fork } = require('child_process')
const path = require('path')
const lruCache = require('lru-cache')

const linters = lruCache({
  max: 2,
  dispose (cacheKey, linter) {
    linter.shutdown()
  }
})

const lintWorkerPath = path.resolve(__dirname, 'lintWorker.js')

function getCallbackOnce (pending, id) {
  const callback = pending.get(id)
  pending.delete(id)
  return callback
}

const createLinter = (linterName, projectRoot) => {
  const child = fork(lintWorkerPath, [ linterName ], {
    cwd: projectRoot
  })
  let sequenceNumber = 0
  const pendingCallbacks = new Map()

  child.on('message', data => {
    const callback = getCallbackOnce(pendingCallbacks, data.id)
    if (callback) {
      if (data.err) {
        return callback(data.err)
      } else {
        return callback(null, data.result)
      }
    }
  })

  return {
    lintText (filePath, fileContent, cb) {
      sequenceNumber++
      const id = sequenceNumber
      pendingCallbacks.set(id, cb)

      child.send({
        filename: filePath,
        id: id,
        source: fileContent
      })
    },
    shutdown () {
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
  return new Promise((resolve, reject) => {
    const cacheKey = linterName + '\n' + projectRoot
    let linter = linters.get(cacheKey)

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

module.exports.cleanLinters = () => {
  linters.reset()
}
