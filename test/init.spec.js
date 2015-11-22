/* global describe, it */

var expect = require('unexpected').clone()
var path = require('path')
var plugin = require('../init')
var textEditorFactory = require('./util/textEditorFactory')
var linter = plugin.provideLinter()
var lint = linter.lint.bind(linter)

expect.addAssertion('to be a valid lint report', function (expect, subject) {
  return expect(subject, 'to have items satisfying', {
    type: expect.it('to be a string').and('not to be empty'),
    text: expect.it('to be a string').and('not to be empty'),
    filePath: expect.it('to be a string').and('to match', /\.js$/),
    range: expect.it('to have items satisfying', 'to have items satisfying', 'to be a number')
  })
})

describe('linter-js-standard-engine', function () {
  it('should be able to lint a test file', function () {
    var textEditor = textEditorFactory('var foo = "bar"')
    return expect(lint(textEditor), 'to be fulfilled').then(function (data) {
      return expect(data, 'to be a valid lint report')
    })
  })
  it('should be able to lint a test file', function () {
    var textEditor = textEditorFactory({
      source: 'var foo = "bar"',
      path: path.resolve(__dirname, 'fixtures', 'faked', 'foo.js')
    })
    return expect(lint(textEditor), 'to be fulfilled').then(function (data) {
      return expect(data, 'to be empty')
    })
  })
})
