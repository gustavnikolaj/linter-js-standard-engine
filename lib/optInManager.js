const { createHash, randomBytes } = require('crypto')
const caches = require('./caches')

const NONE = 1
exports.NONE = NONE

const SOME = 2
exports.SOME = SOME

const ALL = 3
exports.ALL = ALL

class State {
  constructor (allowAll, { seed, allowed = [] } = {}) {
    this.allowAll = allowAll && Promise.resolve(true)
    this.seed = seed ? Buffer.from(seed, 'base64') : randomBytes(16)
    this.allowed = new Set(allowed)

    this.cache = caches.add(new Map())
  }

  dispose () {
    this.cache.clear()
  }
}

let state
let subscription

function activate (serialized) {
  state = new State(atom.config.get('linter-js-standard-engine.enabledProjects') === ALL, serialized)

  subscription = atom.config.onDidChange('linter-js-standard-engine.enabledProjects', ({newValue}) => {
    state.dispose()

    state = new State(newValue === ALL)
    if (newValue === NONE) {
      atom.config.set('linter-js-standard-engine.enabledProjects', SOME)
    }
  })
}
exports.activate = activate

function deactivate () {
  subscription.dispose()
}
exports.deactivate = deactivate

function serialize () {
  return {
    seed: state.seed.toString('base64'),
    allowed: Array.from(state.allowed)
  }
}
exports.serialize = serialize

function checkPermission (linterName, projectRoot) {
  if (state.allowAll) return state.allowAll

  const {cache} = state
  const cacheKey = `${linterName}\n${projectRoot}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  // Hash the cache key, no need to store project paths and linter names in the serialized state.
  const stateKey = createHash('sha256')
    .update(state.seed)
    .update(cacheKey)
    .digest('base64')

  if (state.allowed.has(stateKey)) {
    const promise = Promise.resolve(true)
    cache.set(cacheKey, promise)
    return promise
  }

  const promise = new Promise(resolve => {
    let dismissedViaButton = false

    const notification = atom.notifications.addInfo('Enable linter?', {
      buttons: [
        {
          text: 'This project only',
          onDidClick () {
            state.allowed.add(stateKey)
            resolve(true)
            dismissedViaButton = true
            notification.dismiss()
          }
        },
        {
          text: 'Run any linter for this and all future projects',
          onDidClick () {
            atom.config.set('linter-js-standard-engine.enabledProjects', ALL)
            resolve(true)
            dismissedViaButton = true
            notification.dismiss()
          }
        }
      ],
      description: `Do you want to run \`${linterName}\`, as provided by \`${projectRoot}\`?`,
      dismissable: true
    })

    notification.onDidDismiss(() => {
      if (dismissedViaButton) return

      cache.delete(cacheKey)
      resolve(false)
    })
  })
  cache.set(cacheKey, promise)
  return promise
}
exports.checkPermission = checkPermission
