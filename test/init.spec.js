/* global describe, it */

var expect = require('unexpected')
var plugin = require('../init')
var textEditorFactory = require('./util/textEditorFactory')
var linter = plugin.provideLinter()
var lint = linter.lint.bind(linter)


describe('linter-js-standard-engine', function () {
  it('should be able to lint a test file', function () {
    var textEditor = textEditorFactory('var foo = "bar"')
    console.log(textEditor.getPath())
    return expect(lint(textEditor), 'to be fulfilled').then(function (data) {
      console.log(data)
    })
  })
})
