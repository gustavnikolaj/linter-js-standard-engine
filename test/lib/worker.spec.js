/* global describe, it */

const expect = require('unexpected')
const childProcess = require('child_process')
const path = require('path')

const workerPath = require.resolve('../../lib/worker')

describe('lib/worker', () => {
  it('should only load linter once', () => {
    const child = childProcess.fork(workerPath, [require.resolve('../fixtures/stubForWorker')])
    const messages = []
    const promise = new Promise(resolve => {
      child.on('message', m => {
        messages.push(m)
        if (messages.length === 2) {
          resolve()
        }
      })
    })

    child.send({ id: 1, source: '' })
    child.send({ id: 2, source: '' })

    return promise.then(() => {
      expect(messages[0].results[0], 'to have property', 'count', 1)
      expect(messages[1].results[0], 'to have property', 'count', 2)
    })
  })
  it('should report crashes in linter loading', () => {
    const child = childProcess.fork(workerPath, [require.resolve('../fixtures/stubForWorker/crashing')])
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message.error, 'to have property', 'message', 'crash in linter loading')
    })
  })
  it('should report missing linters as a linter message', () => {
    const child = childProcess.fork(workerPath, ['non-existent-for-sure-or-so-we-hope'])
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message, 'to satisfy', {
        results: [
          {
            messages: [
              {
                message: 'Could not load linter "non-existent-for-sure-or-so-we-hope"',
                fatal: true
              }
            ]
          }
        ]
      })
    })
  })
  it('should resolve linter from working directory', () => {
    const cwd = path.resolve(__dirname, '..', 'fixtures', 'localLinter')
    const child = childProcess.fork(workerPath, ['my-linter'], { cwd })
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message.results[0], 'to have property', 'hello', 'world')
    })
  })
  it('should report crashes when linting', () => {
    const child = childProcess.fork(workerPath, [require.resolve('../fixtures/stubForWorker/crashOnLint')])
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message.error, 'to have property', 'message', 'threw when linting')
    })
  })
  it('should report errors when linting', () => {
    const child = childProcess.fork(workerPath, [require.resolve('../fixtures/stubForWorker/errOnLint')])
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message.error, 'to have property', 'message', 'err when linting')
    })
  })
  it('should serialize errors', () => {
    const child = childProcess.fork(workerPath, [require.resolve('../fixtures/stubForWorker/errOnLint')])
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message.error, 'to have property', 'stack')
      expect(message.error.stack, 'to contain', `${require.resolve('../fixtures/stubForWorker/errOnLint')}:2`)
    })
  })
})
