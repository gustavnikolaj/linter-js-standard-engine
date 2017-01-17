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

    config: {
      _callbacks: new Map(),
      _map: new Map(),

      get (key) {
        return this._map.get(key)
      },

      set (key, value) {
        this._map.set(key, value)
      },

      onDidChange (key, callback) {
        if (!this._callbacks.has(key)) {
          this._callbacks.set(key, new Set())
        }
        const set = this._callbacks.get(key)
        set.add(callback)
        return {
          dispose () {
            set.delete(callback)
          }
        }
      }
    },

    notifications: {
      _errors: [],
      _enableLinters: null,

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
      },

      addInfo (message, options) {
        let obj

        if (message === 'Enable linter?') {
          if (this._enableLinters) {
            obj = {
              options,
              _callbacks: new Set(),
              _dismiss () {
                for (const cb of this._callbacks) {
                  cb()
                }
              }
            }

            this._enableLinters.push(obj)
          } else {
            setImmediate(() => {
              (options.buttons[0].onDidClick)()
            })
          }
        }

        return {
          dismiss () {
            if (obj) {
              obj._dismiss()
            }
          },
          onDidDismiss (callback) {
            if (obj) {
              obj._callbacks.add(callback)
            }
          }
        }
      }
    },

    workspace: {
      _activeTextEditor: null,

      getActiveTextEditor () {
        return this._activeTextEditor
      }
    }
  }
}
