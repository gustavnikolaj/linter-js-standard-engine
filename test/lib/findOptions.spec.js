/* global describe, it */

var expect = require('unexpected')
  .clone()
  .use(require('unexpected-fs'))
var path = require('path')
var findOptions = require('../../lib/findOptions')

describe('lib/findOptions', function () {
  it('should be able to find options about this module', function () {
    return expect(findOptions(__filename), 'to be fulfilled').then(function (options) {
      return expect(options, 'to satisfy', {
        linter: 'standard',
        pathToLinter: /node_modules\/standard$/,
        options: {
          globals: [ 'atom' ]
        }
      })
    })
  })
  it('should be able to find options about this module in a nested module', function () {
    var mockedFileSystem = {}
    var fixturesPath = path.resolve(__dirname, '../some-module')
    mockedFileSystem[fixturesPath] = {
      'package.json': '{}',
      'index.js': 'module.exports = "double quotes!!!"'
    }
    var fileName = path.resolve(fixturesPath, 'index.js')
    return expect(function () {
      return expect(findOptions(fileName), 'to be fulfilled').then(function (options) {
        return expect(options, 'to satisfy', {
          linter: 'standard',
          pathToLinter: /node_modules\/standard$/,
          options: {
            globals: [ 'atom' ]
          }
        })
      })
    }, 'with fs mocked out', mockedFileSystem, 'not to error')
  })
  it('should be able to find a devDependency', function () {
    return expect(function () {
      return expect(
        findOptions('/ljse-fixtures/some-module/index.js'),
        'to be fulfilled'
      ).then(function (options) {
        return expect(options, 'to satisfy', {
          linter: 'semistandard',
          pathToLinter: /node_modules\/semistandard$/,
          options: {}
        })
      })
    }, 'with fs mocked out', {
      '/ljse-fixtures/some-module': {
        'package.json': JSON.stringify({
          name: 'some-module',
          devDependencies: {
            'semistandard': '1.0.0'
          }
        }),
        'index.js': 'module.exports = "foo!";'
      }
    }, 'not to error')
  })
})
