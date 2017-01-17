/* global beforeEach, after, describe, it */
const {createHash} = require('crypto')
const expect = require('unexpected').clone()

const optInManager = require('../../lib/optInManager')

describe('optInManager', () => {
  beforeEach(() => {
    atom.config._callbacks = new Map()
    atom.config._map = new Map([['linter-js-standard-engine.enabledProjects', optInManager.SOME]])
    atom.notifications._enableLinters = []
    optInManager.activate()
  })

  after(() => {
    atom.notifications._enableLinters = null
    atom.config._map = new Map()
    atom.config._callbacks = new Map()
  })

  describe('checkPermission()', () => {
    it('shows a notification', () => {
      optInManager.checkPermission()
      expect(atom.notifications._enableLinters, 'not to be empty')
    })

    it('returns false if notification is dismissed', () => {
      const promise = optInManager.checkPermission()
      atom.notifications._enableLinters[0]._dismiss()
      return expect(promise, 'to be fulfilled with', false)
    })

    it('returns true if button to allow project is clicked', () => {
      const promise = optInManager.checkPermission()
      atom.notifications._enableLinters[0].options.buttons[0].onDidClick()
      return expect(promise, 'to be fulfilled with', true)
    })

    it('returns true if button to allow all projects is clicked', () => {
      const promise = optInManager.checkPermission()
      atom.notifications._enableLinters[0].options.buttons[1].onDidClick()
      return expect(promise, 'to be fulfilled with', true)
    })

    it('returns true if all projects are allowed', () => {
      atom.config.set('linter-js-standard-engine.enabledProjects', optInManager.ALL)
      optInManager.activate()
      return expect(optInManager.checkPermission(), 'to be fulfilled with', true)
    })

    it('updates config if all projects are allowed', () => {
      optInManager.checkPermission()
      atom.notifications._enableLinters[0].options.buttons[1].onDidClick()
      expect(atom.config._map.get('linter-js-standard-engine.enabledProjects'), 'to be', optInManager.ALL)
    })

    it('dismisses notification if the first button is clicked', () => {
      optInManager.checkPermission()

      let dismissed = false
      atom.notifications._enableLinters[0]._callbacks.add(() => {
        dismissed = true
      })
      atom.notifications._enableLinters[0].options.buttons[0].onDidClick()
      expect(dismissed, 'to be', true)
    })

    it('dismisses notification if the second button is clicked', () => {
      optInManager.checkPermission()

      let dismissed = false
      atom.notifications._enableLinters[0]._callbacks.add(() => {
        dismissed = true
      })
      atom.notifications._enableLinters[0].options.buttons[1].onDidClick()
      expect(dismissed, 'to be', true)
    })

    it('caches results', () => {
      const promise = optInManager.checkPermission('foo', 'bar')
      expect(promise, 'to be', optInManager.checkPermission('foo', 'bar'))
      expect(promise, 'not to be', optInManager.checkPermission('foo', 'BAZ'))
    })

    it('tracks allowed linters and projects', () => {
      optInManager.checkPermission('foo', 'bar')
      atom.notifications._enableLinters[0].options.buttons[0].onDidClick()
      const {allowed} = optInManager.serialize()
      expect(allowed, 'not to be empty')
    })
  })

  describe('activate()', () => {
    it('subscribes to config changes', () => {
      expect(atom.config._callbacks.get('linter-js-standard-engine.enabledProjects').size, 'to be', 1)
    })

    describe('after config changes to NONE', () => {
      it('resets to SOME', () => {
        atom.config._map.delete('linter-js-standard-engine.enabledProjects')
        for (const cb of atom.config._callbacks.get('linter-js-standard-engine.enabledProjects')) {
          cb({ newValue: optInManager.NONE })
        }
        expect(atom.config._map.get('linter-js-standard-engine.enabledProjects'), 'to be', optInManager.SOME)
      })
    })

    describe('after config changes to ALL', () => {
      describe('checkPermission()', () => {
        it('always returns true, without prompting', () => {
          for (const cb of atom.config._callbacks.get('linter-js-standard-engine.enabledProjects')) {
            cb({ newValue: optInManager.ALL })
          }

          expect(optInManager.checkPermission(), 'to be fulfilled with', true)
          expect(atom.notifications._enableLinters, 'to be empty')
        })
      })
    })

    describe('deserializes state, which is used by checkPermission()', () => {
      it('always true for an allowed linter & project, without prompting', () => {
        const seed = Buffer.from('decafbad', 'hex')
        const serialized = {
          seed: seed.toString('base64'),
          allowed: [createHash('sha256').update(seed).update('foo\nbar').digest('base64')]
        }
        optInManager.activate(serialized)

        expect(optInManager.checkPermission('foo', 'bar'), 'to be fulfilled with', true)
        expect(atom.notifications._enableLinters, 'to be empty')
      })
    })
  })

  describe('deactivate()', () => {
    it('disposes the config change subscription', () => {
      optInManager.deactivate()
      expect(atom.config._callbacks.get('linter-js-standard-engine.enabledProjects').size, 'to be', 0)
    })
  })

  describe('serialize()', () => {
    const seed = Buffer.from('decafbad', 'hex')
    const serialized = {
      seed: seed.toString('base64'),
      allowed: [createHash('sha256').update(seed).update('foo\nbar').digest('base64')]
    }
    optInManager.activate(serialized)

    expect(optInManager.serialize(), 'to equal', serialized)
  })
})
