/* global describe, it */

var expect = require('unexpected').clone()
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
})
