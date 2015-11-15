module.exports = function first (array, predicate) {
  return new Promise(function (resolve, reject) {
    if (array.length > 0) {
      predicate(array[0])
        .then(function (value) {
          if (value) {
            return resolve(array[0])
          } else {
            first(array.slice(1), predicate).then(resolve, reject)
          }
        })
        .catch(reject)
    } else {
      return reject(new Error('No element satisfying predicate.'))
    }
  })
}
