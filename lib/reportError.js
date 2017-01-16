const caches = require('./caches')
const { atom, console } = require('./globals')

const displayed = caches.add(new Set())

function reportError (err) {
  console.error(err)

  const key = err.message
  if (!displayed.has(key)) {
    displayed.add(key)
    const notification = atom.notifications.addError('Standard Engine: An error occurred', {
      description: err.message,
      dismissable: true
    })

    notification.onDidDismiss(() => displayed.delete(key))
  }
}

module.exports = reportError
