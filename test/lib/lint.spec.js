/* global describe, it */

const path = require('path')
const expect = require('unexpected').clone()
const proxyquire = require('proxyquire')
const textEditorFactory = require('../util/textEditorFactory')
const { MissingLinterError, MissingPackageError } = require('../../lib/findOptions')

describe('lib/lint.js', () => {
  let stub
  const lint = proxyquire('../../lib/lint', {
    './getLinter' () {
      return {
        lintText (...args) {
          return stub(...args)
        }
      }
    }
  })

  it('should convert a eslint report to an atom report', () => {
    stub = () => Promise.resolve([
      {
        filePath: '<text>',
        messages: [
          {
            ruleId: 'eol-last',
            severity: 2,
            message: 'Newline required at end of file but not found.',
            line: 1,
            column: 2,
            nodeType: 'Program',
            source: 'var foo = "bar"',
            fix: { range: [15, 15], text: '\n' }
          },
          {
            ruleId: 'no-unused-vars',
            severity: 2,
            message: '"foo" is defined but never used',
            line: 1,
            column: 5,
            nodeType: 'Identifier',
            source: 'var foo = "bar"'
          },
          {
            ruleId: 'quotes',
            severity: 2,
            message: 'Strings must use singlequote.',
            line: 1,
            column: 11,
            nodeType: 'Literal',
            source: 'var foo = "bar"',
            fix: { range: [10, 15], text: "'bar'" }
          },
          {
            fatal: true,
            message: 'Made up message to test fallback code paths'
          }
        ],
        errorCount: 3,
        warningCount: 0
      }
    ])

    const filePath = path.resolve(__dirname, '..', 'fixtures', 'file.js')
    const textEditor = textEditorFactory({
      source: 'var foo = "bar"',
      path: filePath
    })
    return expect(lint(textEditor), 'to be fulfilled').then(report => expect(report, 'to equal', [
      {
        type: 'Warning',
        text: 'Newline required at end of file but not found.',
        filePath,
        range: [ [ 0, 0 ], [ 0, 1 ] ]
      },
      {
        type: 'Warning',
        text: '"foo" is defined but never used',
        filePath,
        range: [ [ 0, 1 ], [ 0, 4 ] ]
      },
      {
        type: 'Warning',
        text: 'Strings must use singlequote.',
        filePath,
        range: [ [ 0, 1 ], [ 0, 10 ] ]
      },
      {
        type: 'Error',
        text: 'Made up message to test fallback code paths',
        filePath,
        range: [ [ 0, 0 ], [ 0, 0 ] ]
      }
    ]))
  })

  describe('error handling', () => {
    let currentError
    const stubbedOptions = proxyquire('../../lib/lint', {
      './findOptions' () {
        return Promise.reject(currentError)
      }
    })

    for (const ErrorClass of [MissingLinterError, MissingPackageError]) {
      it(`should suppress "${ErrorClass.name}" errors`, () => {
        currentError = new ErrorClass()
        return expect(stubbedOptions(textEditorFactory('')), 'to be fulfilled').then(data => expect(data, 'to be empty'))
      })
    }

    it('should add errors that are not suppressed', () => {
      atom.notifications._errors = []
      currentError = new Error('do not suppress me')
      stub = () => Promise.reject(currentError)
      return expect(lint(textEditorFactory('')), 'to be fulfilled').then(data => {
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
      stub = () => Promise.reject(currentError)
      return expect(lint(textEditorFactory('')), 'to be fulfilled').then(data => {
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

  it('should add an error upon receiving an invalid report from the linters lintText() method', () => {
    stub = () => Promise.resolve([])
    atom.notifications._errors = []
    return expect(lint(textEditorFactory('')), 'to be fulfilled').then(data => {
      expect(data, 'to be empty')

      expect(atom.notifications._errors, 'to have length', 1)
      const actual = atom.notifications._errors[0]

      actual.silence()

      expect(actual, 'to satisfy', {
        desc: 'invalid lint report'
      })
    })
  })
})
