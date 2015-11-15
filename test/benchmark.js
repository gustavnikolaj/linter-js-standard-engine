require('./util/promiseHelper')
var textEditorFactory = require('./util/textEditorFactory')
var linter = require('../init').provideLinter()
var debugFactory = require('debug')

var firstRun = debugFactory('first run')
var secondRun = debugFactory('second run')

var startTime = Date.now()

firstRun('started')

linter.lint(textEditorFactory('var foo = "bar"')).then(function (data) {
  firstRun('done')

  secondRun('started')
  linter.lint(textEditorFactory('var foo = "bar"')).then(function (data) {
    secondRun('done')

    console.log('\nTotal time spent:', Date.now() - startTime, 'ms')
  })
})
