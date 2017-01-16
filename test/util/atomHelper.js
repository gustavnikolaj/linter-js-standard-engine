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

      addError (message, options) {
        const obj = {
          message,
          options,
          _callbacks: new Set(),
          _dismiss () {
            for (const cb of this._callbacks) {
              cb()
            }
          }
        }
        this._errors.push(obj)

        return {
          onDidDismiss (callback) {
            obj._callbacks.add(callback)
          }
        }
      }
    }
  }
}
