if (typeof global.atom === 'undefined') {
  global.atom = {
    notifications: {
      _errors: [],

      addError (desc, obj) {
        const promise = new Promise((resolve, reject) => {
          // Reject using setImmediate, allowing tests to silence the error
          // before it's reported has an unhandled rejection.
          setImmediate(() => reject(obj.error))
        })

        this._errors.push({
          desc,
          obj,
          silence () {
            promise.catch(() => {})
          }
        })

        return promise
      }
    }
  }
}
