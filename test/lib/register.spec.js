'use strict'
/* global describe, it */

const expect = require('unexpected').clone()
const proxyquire = require('proxyquire').noPreserveCache()
const fs = require('fs')
const path = require('path')
const plugin = require('../../lib/register')
const textEditorFactory = require('../util/textEditorFactory')
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
      path: path.resolve(__dirname, '..', 'fixtures', 'faked', 'foo.js')
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
    const filePath = path.resolve(__dirname, '..', 'fixtures', 'simpleSemiStandard', 'index.js')
    const textEditor = textEditorFactory({
      source: fs.readFileSync(filePath),
      path: filePath
    })
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be empty'))
  })
  it('should clear all caches when deactivated', () => {
    let cleared = false
    const plugin = proxyquire('../../lib/register', {
      './caches': {
        clearAll () {
          cleared = true
        }
      }
    })

    expect(cleared, 'to be false')
    plugin.deactivate()
    expect(cleared, 'to be true')
  })
})
