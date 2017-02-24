exports.lintText = (source, opts, cb) => {
  setImmediate(() => cb(null, { results: [ { callback: true } ] }))
  return { results: [ { callback: false } ] }
}
