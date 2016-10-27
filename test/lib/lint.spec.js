/* global describe, it */

var expect = require('unexpected').clone()
var lintFactory = require('../../lib/lint')

describe('lib/lint.js', function () {
  it('should return a function when called with path and content', function () {
    return expect(lintFactory('/filePath', 'var foo = bar'), 'to be a function')
  })
  it('should forward errors from the linters lintText() method', function () {
    var lint = lintFactory('/filePath', 'var foo = bar')
    var linterMock = {
      lintText: function (fileContent, opts, cb) {
        return cb(new Error('MockError'))
      }
    }
    return expect(lint(linterMock), 'to be rejected').then(function (err) {
      return expect(err, 'to have message', 'MockError')
    })
  })
  it('should convert error strings from the linters lintText() method', () => {
    const lint = lintFactory('/filePath', 'var foo = bar')
    const linterMock = {
      lintText: function (fileContent, opts, cb) {
        return cb('error string')
      }
    }
    return expect(lint(linterMock), 'to be rejected').then(function (err) {
      return expect(err, 'to have message', 'error string')
    })
  })
  it('should fail upon receiving an invalid report from the linters lintText() method', () => {
    const lint = lintFactory('/filePath', 'var foo = bar')
    const linterMock = {
      lintText: function (fileContent, opts, cb) {
        return cb(null)
      }
    }
    return expect(lint(linterMock), 'to be rejected').then(function (err) {
      return expect(err, 'to have message', 'invalid lint report')
    })
  })
  it('should convert a eslint report to an atom report', function () {
    var lint = lintFactory('/filePath', 'var foo = bar')
    var linterMock = {
      lintText: function (fileContent, opts, cb) {
        var output = {
          results: [
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
          ],
          errorCount: 3,
          warningCount: 0
        }
        return cb(null, output)
      }
    }
    return expect(lint(linterMock), 'to be fulfilled').then(function (report) {
      return expect(report, 'to equal', [
        {
          type: 'Warning',
          text: 'Newline required at end of file but not found.',
          filePath: '/filePath',
          range: [ [ 0, 0 ], [ 0, 1 ] ]
        },
        {
          type: 'Warning',
          text: '"foo" is defined but never used',
          filePath: '/filePath',
          range: [ [ 0, 1 ], [ 0, 4 ] ]
        },
        {
          type: 'Warning',
          text: 'Strings must use singlequote.',
          filePath: '/filePath',
          range: [ [ 0, 1 ], [ 0, 10 ] ]
        },
        {
          type: 'Error',
          text: 'Made up message to test fallback code paths',
          filePath: '/filePath',
          range: [ [ 0, 0 ], [ 0, 0 ] ]
        }
      ])
    })
  })
})
