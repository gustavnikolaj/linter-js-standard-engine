'use strict'
/* global describe, it */

const expect = require('unexpected')
const proxyquire = require('proxyquire').noPreserveCache()
const EventEmitter = require('events')
const caches = require('../../lib/caches')

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
  it('should forward errors to the lintText() promise', () => {
    const linter = getLinter('linter', '/')
    const expected = 'error'
    forks.linter.on('send', cmd => {
      forks.linter.emit('message', { id: cmd.id, error: { message: expected } })
    })

    return expect(linter.lintText('', {}), 'to be rejected').then(actual => {
      expect(actual, 'to be a', Error)
      expect(actual, 'to have message', expected)
    })
  })
  it('should ignore unexpected messages from the worker', () => {
    getLinter('linter', '/')
    forks.linter.emit('message', { id: 10 })
  })
  it('should clean up linters that exit', () => {
    const foo = getLinter('first', '/')
    expect(getLinter('first', '/'), 'to be', foo)
    forks.first.emit('exit')
    return new Promise(resolve => setTimeout(resolve, 10))
      .then(() => {
        const bar = getLinter('first', '/')
        expect(bar, 'not to be', foo)

        // Ensure first is purged from the cache
        getLinter('second', '/')
        getLinter('third', '/')

        const child = forks.first
        expect(child, 'to have property', 'wasDisconnected', true)
        const baz = getLinter('first', '/')

        child.emit('exit')
        return new Promise(resolve => setTimeout(resolve, 10))
        .then(() => {
          expect(getLinter('first', '/'), 'to be', baz)
        })
      })
  })
  it('should ignore disconnect errors', () => {
    const linter = getLinter('first', '/')
    forks.first.disconnect = () => { throw new Error('ignore me') }
    expect(() => linter.shutdown(), 'not to throw')
  })

  describe('clearing all caches', () => {
    it('should shut down all workers', () => {
      // Reset state
      caches.clearAll()

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

      caches.clearAll()
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
