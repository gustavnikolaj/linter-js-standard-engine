require('./util/promiseHelper')
const textEditorFactory = require('./util/textEditorFactory')
const linter = require('../init').provideLinter()
const debugFactory = require('debug')

const firstRun = debugFactory('first run')
const secondRun = debugFactory('second run')

const startTime = Date.now()

firstRun('started')

linter.lint(textEditorFactory('var foo = "bar"')).then(data => {
  firstRun('done')

  secondRun('started')
  linter.lint(textEditorFactory('var foo = "bar"')).then(data => {
    secondRun('done')

    console.log('\nTotal time spent:', Date.now() - startTime, 'ms')
  })
})
