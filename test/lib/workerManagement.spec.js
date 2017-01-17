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

const workerManagement = proxyquire('../../lib/workerManagement', {
  'child_process': {
    fork (workerPath, args, opts) {
      const name = args[0]
      const child = new Child()
      forks[name] = child
      return child
    }
  }
})

describe('lib/workerManagement', () => {
  it('should shut down least recently used workers', () => {
    workerManagement.getWorker('first', '/')
    workerManagement.getWorker('second', '/')
    expect(forks, 'to satisfy', {
      first: {
        wasDisconnected: false
      },
      second: {
        wasDisconnected: false
      }
    })

    workerManagement.getWorker('third', '/')
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
  it('should forward errors to the lint() promise', () => {
    const worker = workerManagement.getWorker('linter', '/')
    const expected = 'error'
    forks.linter.on('send', cmd => {
      forks.linter.emit('message', { id: cmd.id, error: { message: expected } })
    })

    return expect(worker.lint('', {}), 'to be rejected').then(actual => {
      expect(actual, 'to be a', Error)
      expect(actual, 'to have message', expected)
    })
  })
  it('should ignore unexpected messages from the worker', () => {
    workerManagement.getWorker('linter', '/')
    forks.linter.emit('message', { id: 10 })
  })
  it('should clean up linters that exit', () => {
    const foo = workerManagement.getWorker('first', '/')
    expect(workerManagement.getWorker('first', '/'), 'to be', foo)
    forks.first.emit('exit')
    return new Promise(resolve => setTimeout(resolve, 10))
      .then(() => {
        const bar = workerManagement.getWorker('first', '/')
        expect(bar, 'not to be', foo)

        // Ensure first is purged from the cache
        workerManagement.getWorker('second', '/')
        workerManagement.getWorker('third', '/')

        const child = forks.first
        expect(child, 'to have property', 'wasDisconnected', true)
        const baz = workerManagement.getWorker('first', '/')

        child.emit('exit')
        return new Promise(resolve => setTimeout(resolve, 10))
        .then(() => {
          expect(workerManagement.getWorker('first', '/'), 'to be', baz)
        })
      })
  })
  it('should ignore disconnect errors', () => {
    const worker = workerManagement.getWorker('first', '/')
    forks.first.disconnect = () => { throw new Error('ignore me') }
    expect(() => worker.dispose(), 'not to throw')
  })

  describe('clearing all caches', () => {
    it('should shut down all workers', () => {
      // Reset state
      caches.clearAll()

      workerManagement.getWorker('first', '/')
      workerManagement.getWorker('second', '/')
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
