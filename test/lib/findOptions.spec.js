/* global describe, it */

var expect = require('unexpected')
var path = require('path')
var findOptions = require('../../lib/findOptions')

function fixturesPath (relativePath) {
  return path.resolve(__dirname, '../fixtures', relativePath)
}

describe('lib/findOptions', function () {
  it('should be able to find options about this module', function () {
    return expect(findOptions(__filename), 'to be fulfilled').then(function (options) {
      return expect(options, 'to satisfy', {
        linter: 'standard',
        pathToLinter: require.resolve('standard'),
        options: {
          globals: [ 'atom' ]
        }
      })
    })
  })
  it('should be able to find semistandard listed as devDependency', function () {
    return expect(function () {
      var file = fixturesPath('simpleSemiStandard/index.js')
      return expect(findOptions(file), 'to be fulfilled').then(function (options) {
        return expect(options, 'to equal', {
          projectRoot: fixturesPath('simpleSemiStandard'),
          linter: 'semistandard',
          pathToLinter: fixturesPath('simpleSemiStandard/node_modules/semistandard/index.js'),
          options: {}
        })
      })
    }, 'not to error')
  })
  it('should be able to find @novemberborn/as-i-preach', function () {
    return expect(function () {
      var file = fixturesPath('scopedLinter/index.js')
      return expect(findOptions(file), 'to be fulfilled').then(function (options) {
        return expect(options, 'to equal', {
          projectRoot: fixturesPath('scopedLinter'),
          linter: '@novemberborn/as-i-preach',
          pathToLinter: fixturesPath('scopedLinter/node_modules/@novemberborn/as-i-preach/index.js'),
          options: {}
        })
      })
    }, 'not to error')
  })
})
