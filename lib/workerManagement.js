const { fork } = require('child_process')
const lruCache = require('lru-cache')

const caches = require('./caches')
const workerPath = require.resolve('./worker')

const workers = caches.add(lruCache({
  max: 2,
  dispose (_, worker) {
    worker.dispose()
  }
}))

function takeResolvers (pending, id) {
  const resolvers = pending.get(id)
  pending.delete(id)
  return resolvers
}

function createWorker (linterName, cwd) {
  const worker = fork(workerPath, [linterName], { cwd })

  let sequenceNumber = 0
  const pendingResolvers = new Map()

  worker.on('message', ({ id, error, results }) => {
    const resolvers = takeResolvers(pendingResolvers, id)
    if (!resolvers) return

    if (error) {
      Object.setPrototypeOf(error, Error.prototype)
      resolvers.reject(error)
    } else {
      resolvers.resolve(results)
    }
  })

  return {
    lint (filename, text, fix) {
      const id = ++sequenceNumber
      return new Promise((resolve, reject) => {
        pendingResolvers.set(id, { resolve, reject })
        worker.send({ filename, fix, id, text })
      })
    },

    dispose () {
      // Ignore errors thrown, since this method may be called when the worker
      // is removed from the cache even if it has already exited.
      try {
        worker.disconnect()
      } catch (err) {}
    },

    disposed: new Promise(resolve => worker.once('exit', resolve))
  }
}

function getWorker (linterName, projectRoot) {
  const cacheKey = linterName + '\n' + projectRoot
  if (workers.has(cacheKey)) return workers.get(cacheKey)

  const worker = createWorker(linterName, projectRoot)
  workers.set(cacheKey, worker)
  worker.disposed.then(() => {
    // A new worker may have been created in the meantime, make sure not to
    // delete that one.
    if (workers.peek(cacheKey) === worker) {
      workers.del(cacheKey)
    }
  })

  return worker
}

exports.getWorker = getWorker
