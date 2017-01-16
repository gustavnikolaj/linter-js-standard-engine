'use strict'
/* global describe, it */
const expect = require('unexpected').clone()
const proxyquire = require('proxyquire').noPreserveCache()

describe('lib/commands', () => {
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
