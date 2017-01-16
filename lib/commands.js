const caches = require('./caches')

module.exports = {
  'Standard Engine:Restart' () {
    caches.clearAll()
  }
}
