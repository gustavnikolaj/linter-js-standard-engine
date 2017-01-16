'use strict'
/* global describe, it */
const expect = require('unexpected').clone()
const proxyquire = require('proxyquire').noPreserveCache()

const caches = require('../../lib/caches')

let lastError
const reportError = proxyquire('../../lib/reportError', {
  './globals': {
    atom,
    console: {
      error (err) {
        lastError = err
      }
    }
  }
})

describe('lib/reportError', () => {
  it('should add a notification', () => {
    atom.notifications._errors = []
    reportError(new Error('This is the message'))

    expect(atom.notifications._errors, 'to have length', 1)

    const [ notification ] = atom.notifications._errors
    expect(notification, 'to satisfy', {
      message: 'Standard Engine: An error occurred',
      options: {
        description: 'This is the message',
        dismissable: true
      }
    })
  })
  it('should write to the console', () => {
    const expected = new Error('This is the message')
    reportError(expected)
    expect(lastError, 'to be', expected)

    lastError = null
    reportError(expected)
    expect(lastError, 'to be', expected)
  })
  it('should not add duplicate notifications, based on message', () => {
    atom.notifications._errors = []
    caches.clearAll()
    reportError(new Error('This is the message'))

    expect(atom.notifications._errors, 'to have length', 1)
  })
  it('should add duplicate notifications once the previous one has been dismissed', () => {
    atom.notifications._errors = []
    caches.clearAll()
    reportError(new Error('This is the message'))

    expect(atom.notifications._errors, 'to have length', 1)
    atom.notifications._errors[0]._dismiss()

    reportError(new Error('This is the message'))
    expect(atom.notifications._errors, 'to have length', 2)
  })
  it('should add duplicate notifications after caches have been cleared', () => {
    atom.notifications._errors = []
    caches.clearAll()
    reportError(new Error('This is the message'))

    expect(atom.notifications._errors, 'to have length', 1)
    caches.clearAll()

    reportError(new Error('This is the message'))
    expect(atom.notifications._errors, 'to have length', 2)
  })
})
