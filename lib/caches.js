const caches = new Set()

function add (cache) {
  caches.add(cache)
  return cache
}
exports.add = add

function clearAll () {
  for (const cache of caches) {
    cache.reset()
  }
}
exports.clearAll = clearAll
