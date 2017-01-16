const { fork } = require('child_process')
const { resolve: resolvePath } = require('path')

const lruCache = require('lru-cache')
const caches = require('./caches')

const linters = caches.add(lruCache({
  max: 2,
  dispose (_, linter) {
    linter.shutdown()
  }
}))

const lintWorkerPath = resolvePath(__dirname, 'lintWorker.js')

function getResolversOnce (pending, id) {
  const resolvers = pending.get(id)
  pending.delete(id)
  return resolvers
}

const createLinter = (linterName, projectRoot) => {
  const child = fork(lintWorkerPath, [ linterName ], {
    cwd: projectRoot
  })

  let sequenceNumber = 0
  const pendingResolvers = new Map()

  child.on('message', ({ id, error, results }) => {
    const resolvers = getResolversOnce(pendingResolvers, id)
    if (resolvers) {
      if (error) {
        Object.setPrototypeOf(error, Error.prototype)
        resolvers.reject(error)
      } else {
        resolvers.resolve(results)
      }
    }
  })

  return {
    lintText (filename, source) {
      const id = ++sequenceNumber
      return new Promise((resolve, reject) => {
        pendingResolvers.set(id, { resolve, reject })
        child.send({ filename, id, source })
      })
    },

    shutdown () {
      // Shutdown is optimistic, but may be called when the linter is
      // intentionally removed from the cache. Ignore any errors thrown.
      try {
        child.disconnect()
      } catch (err) {}
    },

    exited: new Promise(resolve => child.once('exit', resolve))
  }
}

function getLinter (linterName, projectRoot) {
  const cacheKey = linterName + '\n' + projectRoot
  if (linters.has(cacheKey)) return linters.get(cacheKey)

  const linter = createLinter(linterName, projectRoot)
  linters.set(cacheKey, linter)
  linter.exited.then(() => {
    // A new linter may have been created in the meantime, make sure not to
    // delete that one.
    if (linters.peek(cacheKey) === linter) {
      linters.del(cacheKey)
    }
  })

  return linter
}

module.exports = getLinter
