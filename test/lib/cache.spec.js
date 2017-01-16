'use strict'
/* global describe, it */
const expect = require('unexpected').clone()

const caches = require('../../lib/caches')

describe('lib/caches', () => {
  describe('add()', () => {
    it('should return the added cache', () => {
      const obj = {}
      expect(caches.add(obj), 'to be', obj)
    })
  })

  describe('clearAll()', () => {
    it('should reset added caches', () => {
      let reset = false
      const cache = {
        reset () {
          reset = true
        }
      }

      expect(reset, 'to be', false)
      caches.add(cache)
      caches.clearAll()
      expect(reset, 'to be', true)
    })
  })
})
