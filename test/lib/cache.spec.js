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
      let reset1 = false
      let cleared2 = false
      const cache1 = {
        reset () {
          reset1 = true
        }
      }
      const cache2 = {
        clear () {
          cleared2 = true
        }
      }

      expect(reset1, 'to be', false)
      expect(cleared2, 'to be', false)
      caches.add(cache1)
      caches.add(cache2)
      caches.clearAll()
      expect(reset1, 'to be', true)
      expect(cleared2, 'to be', true)
    })
  })
})
