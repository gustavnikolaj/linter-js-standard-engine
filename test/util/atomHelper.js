if (typeof global.atom === 'undefined') {
  global.atom = {
    notifications: {
      addError: function (desc, obj) {
        return new Promise(function (resolve, reject) {
          reject(obj.error)
        })
      }
    }
  }
}
