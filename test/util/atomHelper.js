if (typeof global.atom === 'undefined') {
  global.atom = {
    notifications: {
      addError: function (desc, obj) {
        return new Promise(function (resolve, reject) {
          console.log('wtf', obj)
          reject(obj.error)
        })
      }
    }
  }
}
