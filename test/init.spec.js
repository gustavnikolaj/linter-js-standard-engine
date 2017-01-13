'use strict'
/* global describe, it */

const expect = require('unexpected').clone()
const proxyquire = require('proxyquire')
const fs = require('fs')
const path = require('path')
const plugin = require('../init')
const { MissingLinterError, MissingPackageError } = require('../lib/findOptions')
const textEditorFactory = require('./util/textEditorFactory')
const linter = plugin.provideLinter()
const lint = linter.lint.bind(linter)

expect.addAssertion('to be a valid lint report', (expect, subject) => expect(subject, 'to have items satisfying', {
  type: expect.it('to be a string').and('not to be empty'),
  text: expect.it('to be a string').and('not to be empty'),
  filePath: expect.it('to be a string').and('to match', /\.js$/),
  range: expect.it('to have items satisfying', 'to have items satisfying', 'to be a number')
}))

describe('linter-js-standard-engine', () => {
  it('should be able to lint a test file', () => {
    const textEditor = textEditorFactory('var foo = "bar"')
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be a valid lint report'))
  })
  it('should be able to lint a test file', () => {
    const textEditor = textEditorFactory({
      source: 'var foo = "bar"',
      path: path.resolve(__dirname, 'fixtures', 'faked', 'foo.js')
    })
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be empty'))
  })
  it('should skip files with the wrong scope', () => {
    const textEditor = textEditorFactory({ source: '# markdown', scopeName: 'source.gfm' })
    return expect(lint(textEditor), 'to be fulfilled').then(data => {
      expect(data, 'to be empty')
    })
  })
  it('should not skip any files if the ignore option is not set', () => {
    const filePath = path.resolve(__dirname, 'fixtures', 'simpleSemiStandard', 'index.js')
    const textEditor = textEditorFactory({
      source: fs.readFileSync(filePath),
      path: filePath
    })
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be empty'))
  })
  it('should clean linters when deactivated', () => {
    let cleaned = false
    const plugin = proxyquire('../init', {
      './lib/getLinter': {
        cleanLinters () {
          cleaned = true
        }
      }
    })

    expect(cleaned, 'to be false')
    plugin.deactivate()
    expect(cleaned, 'to be true')
  })

  describe('error handling', () => {
    let currentError
    const linter = proxyquire('../init', {
      './lib/lint' () {
        return Promise.reject(currentError)
      }
    }).provideLinter()

    for (const ErrorClass of [MissingLinterError, MissingPackageError]) {
      it(`should suppress "${ErrorClass.name}" errors`, () => {
        currentError = new ErrorClass()
        return expect(linter.lint(textEditorFactory('')), 'to be fulfilled').then(data => expect(data, 'to be empty'))
      })
    }

    it('should add errors that are not suppressed', () => {
      atom.notifications._errors = []
      currentError = new Error('do not suppress me')
      return expect(linter.lint(textEditorFactory('')), 'to be fulfilled').then(data => {
        expect(data, 'to be empty')

        expect(atom.notifications._errors, 'to have length', 1)
        const actual = atom.notifications._errors[0]

        actual.silence()

        expect(actual, 'to satisfy', {
          desc: 'do not suppress me',
          obj: {
            error: currentError,
            detail: currentError.stack,
            dismissable: true
          }
        })
      })
    })
    it('should add errors that are not suppressed with a default description', () => {
      atom.notifications._errors = []
      currentError = new Error('')
      return expect(linter.lint(textEditorFactory('')), 'to be fulfilled').then(data => {
        expect(data, 'to be empty')

        expect(atom.notifications._errors, 'to have length', 1)
        const actual = atom.notifications._errors[0]

        actual.silence()

        expect(actual, 'to satisfy', {
          desc: 'Something bad happened',
          obj: {
            error: currentError,
            detail: currentError.stack,
            dismissable: true
          }
        })
      })
    })
  })
})
