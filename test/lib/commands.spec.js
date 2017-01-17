'use strict'
/* global describe, it */
const expect = require('unexpected').clone()
const proxyquire = require('proxyquire').noPreserveCache()

const textEditorFactory = require('../util/textEditorFactory')

describe('lib/commands', () => {
  describe('fix', () => {
    it('should fix the current editor', () => {
      atom.workspace._activeTextEditor = textEditorFactory()

      let fixed = false
      let args
      const commands = proxyquire('../../lib/commands', {
        './fix' (...actual) {
          fixed = true
          args = actual
        }
      })
      const reportError = require('../../lib/reportError')

      expect(fixed, 'to be false')
      commands['Standard Engine:Fix File']()
      expect(fixed, 'to be true')
      expect(args[0], 'to be', atom.workspace._activeTextEditor)
      expect(args[1], 'to be', reportError)
    })
    it('should do nothing if there is no current editor', () => {
      atom.workspace._activeTextEditor = null

      let fixed = false
      const commands = proxyquire('../../lib/commands', {
        './fix' () {
          fixed = true
        }
      })

      expect(fixed, 'to be false')
      commands['Standard Engine:Fix File']()
      expect(fixed, 'to be false')
    })
  })

  describe('restart', () => {
    it('should clear all caches', () => {
      let cleared = false
      const commands = proxyquire('../../lib/commands', {
        './caches': {
          clearAll () {
            cleared = true
          }
        }
      })

      expect(cleared, 'to be false')
      commands['Standard Engine:Restart']()
      expect(cleared, 'to be true')
    })
  })
})
