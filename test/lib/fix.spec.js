'use strict'
/* global describe, it */
const expect = require('unexpected').clone()
const proxyquire = require('proxyquire').noPreserveCache()

const textEditorFactory = require('../util/textEditorFactory')

describe('lib/fix', () => {
  it('should get output from the linter', () => {
    let args
    const fix = proxyquire('../../lib/fix', {
      './linting': {
        fix (...actual) {
          args = actual
          return Promise.resolve(null)
        }
      }
    })

    const editor = textEditorFactory()
    const reportError = () => {}

    fix(editor, reportError)
    expect(args[0], 'to be', editor)
    expect(args[1], 'to be', reportError)
  })

  it('should update the text buffer if there is output', () => {
    const expected = 'output'
    const fix = proxyquire('../../lib/fix', {
      './linting': {
        fix () {
          return Promise.resolve(expected)
        }
      }
    })

    const editor = textEditorFactory()
    let diff
    editor.getBuffer = () => {
      return {
        setTextViaDiff (output) {
          diff = output
        }
      }
    }

    return fix(editor, () => {}).then(() => expect(diff, 'to equal', expected))
  })
})
