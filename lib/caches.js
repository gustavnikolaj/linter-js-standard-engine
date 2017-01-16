const caches = new Set()

function add (cache) {
  caches.add(cache)
  return cache
}
exports.add = add

function clearAll () {
  for (const cache of caches) {
    if (cache.reset) cache.reset()
    if (cache.clear) cache.clear()
  }
}
exports.clearAll = clearAll
