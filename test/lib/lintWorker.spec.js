/* global describe, it */

const expect = require('unexpected')
const childProcess = require('child_process')

const workerPath = require.resolve('../../lib/lintWorker')

describe('lib/lintWorker', () => {
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
      expect(messages[0].result, 'to have property', 'count', 1)
      expect(messages[1].result, 'to have property', 'count', 2)
    })
  })
  it('should report crashes in linter loading', () => {
    const child = childProcess.fork(workerPath, [require.resolve('../fixtures/stubForWorker/crashing')])
    const promise = new Promise(resolve => {
      child.on('message', m => resolve(m))
    })

    child.send({ id: 1, source: '' })

    return promise.then((message) => {
      expect(message.err, 'to be', 'crash in linter loading')
    })
  })
})
