'use strict'
// Ensure this stub is not cached. The worker should take care of caching it.
delete require.cache[module.id]
// If the module is reloaded then the second time the worker tries to lint the
// text it'll receive a conut of 1, not 2.
let count = 0

exports.lintText = (source, cb) => {
  count++
  cb(null, { count })
}
