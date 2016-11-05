'use strict'
/* global describe, it */

const expect = require('unexpected')
const proxyquire = require('proxyquire')
const EventEmitter = require('events')

const forks = {}

class Child extends EventEmitter {
  constructor () {
    super()
    this.wasDisconnected = false
  }

  send (cmd) {
    this.emit('send', cmd)
  }

  disconnect () {
    this.wasDisconnected = true
  }
}

const getLinter = proxyquire('../../lib/getLinter', {
  'child_process': {
    fork (workerPath, args, opts) {
      const name = args[0]
      const child = new Child()
      forks[name] = child
      return child
    }
  }
})

describe('lib/getLinter', () => {
  it('should shut down least recently used workers', () => {
    getLinter('first', '/')
    getLinter('second', '/')
    expect(forks, 'to satisfy', {
      first: {
        wasDisconnected: false
      },
      second: {
        wasDisconnected: false
      }
    })

    getLinter('third', '/')
    expect(forks, 'to have key', 'third')
    expect(forks, 'to satisfy', {
      first: {
        wasDisconnected: true
      },
      second: {
        wasDisconnected: false
      },
      third: {
        wasDisconnected: false
      }
    })
  })
  it('should forward errors to the lintText() callback', () => {
    const linter = getLinter('linter', '/')
    const expected = Symbol()
    forks.linter.on('send', cmd => {
      forks.linter.emit('message', { id: cmd.id, err: expected })
    })

    const promise = linter.then(linter => {
      return new Promise((resolve, reject) => {
        linter.lintText('', reject)
      })
    })

    return expect(promise, 'to be rejected').then(actual => {
      expect(actual, 'to be', expected)
    })
  })
  it('should ignore unexpected messages from the worker', () => {
    getLinter('linter', '/')
    forks.linter.emit('message', { id: 10 })
  })
  it('should clean up linters that exit', () => {
    return getLinter('first', '/').then(first => {
      return expect(getLinter('first', '/'), 'when fulfilled', 'to be', first)
        .then(() => {
          forks.first.emit('exit')
          return new Promise(resolve => setTimeout(resolve, 10))
        })
        .then(() => {
          const old = first
          return getLinter('first', '/').then(first => {
            expect(first, 'not to be', old)

            // Ensure first is purged from the cache
            getLinter('second', '/')
            getLinter('third', '/')

            const child = forks.first
            expect(child, 'to have property', 'wasDisconnected', true)
            const promise = getLinter('first', '/')

            child.emit('exit')
            return new Promise(resolve => setTimeout(resolve, 10))
              .then(() => promise)
              .then(first => {
                return expect(getLinter('first', '/'), 'when fulfilled', 'to be', first)
              })
          })
        })
    })
  })
  it('should ignore disconnect errors', () => {
    return getLinter('first', '/').then(linter => {
      forks.first.disconnect = () => { throw new Error('ignore me') }
      expect(() => linter.shutdown(), 'not to throw')
    })
  })

  describe('cleanLinters()', () => {
    it('should shut down all workers', () => {
      // Reset state
      getLinter.cleanLinters()

      getLinter('first', '/')
      getLinter('second', '/')
      expect(forks, 'to satisfy', {
        first: {
          wasDisconnected: false
        },
        second: {
          wasDisconnected: false
        }
      })

      getLinter.cleanLinters()
      expect(forks, 'to satisfy', {
        first: {
          wasDisconnected: true
        },
        second: {
          wasDisconnected: true
        }
      })
    })
  })
})
