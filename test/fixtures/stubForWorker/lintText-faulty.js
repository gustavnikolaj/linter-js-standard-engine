exports.lintText = (source, opts, cb) => {
  setImmediate(() => cb(null, { results: [] }))
  return { results: [] }
}
