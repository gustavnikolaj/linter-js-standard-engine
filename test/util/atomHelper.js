if (typeof global.atom === 'undefined') {
  global.atom = {
    commands: {
      _commands: {},

      add (target, ...args) {
        if (args.length === 1) {
          const [commands] = args
          const disposables = []
          for (const name in commands) {
            disposables.push(this.add(target, name, commands[name]))
          }

          return {
            dispose () {
              for (const disposable of disposables) {
                disposable.dispose()
              }
            }
          }
        }

        const [name, callback] = args
        const obj = { name, callback, disposed: false }
        ;(this._commands[target] || (this._commands[target] = [])).push(obj)
        return {
          dispose () {
            obj.disposed = true
          }
        }
      }
    },

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
