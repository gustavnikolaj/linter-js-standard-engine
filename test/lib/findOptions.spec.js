/* global describe, it */

var expect = require('unexpected')
var uniqueTempDir = require('unique-temp-dir')
var path = require('path')
var findOptions = require('../../lib/findOptions')

function fixturesPath (relativePath) {
  return path.resolve(__dirname, '../fixtures', relativePath)
}

describe('lib/findOptions', function () {
  it('should be able to find options about this module', function () {
    return expect(findOptions(__filename), 'to be fulfilled').then(function (options) {
      return expect(options, 'to satisfy', {
        linterName: 'standard',
        ignoreGlobs: ['test/fixtures/faked/*.js']
      })
    })
  })
  it('should be able to find semistandard listed as devDependency', function () {
    var file = fixturesPath('simpleSemiStandard/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(function (options) {
      return expect(options, 'to equal', {
        projectRoot: fixturesPath('simpleSemiStandard'),
        linterName: 'semistandard',
        ignoreGlobs: []
      })
    })
  })
  it('should be able to find a linter from the standard-engine package.json key', function () {
    var file = fixturesPath('standardEngineKey/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(function (options) {
      return expect(options, 'to equal', {
        projectRoot: fixturesPath('standardEngineKey'),
        linterName: 'my-linter',
        ignoreGlobs: []
      })
    })
  })
  it('should read config for scoped linters', function () {
    var file = fixturesPath('scopedLinter/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(function (options) {
      return expect(options, 'to equal', {
        projectRoot: fixturesPath('scopedLinter'),
        linterName: '@my-scope/my-linter',
        ignoreGlobs: ['world']
      })
    })
  })
  it('should not select a linter for a project with no linter', function () {
    var file = fixturesPath('noStandardEngine/index.js')
    return expect(findOptions(file), 'to be rejected').then(function (msg) {
      return expect(msg, 'to satisfy', 'no supported linter found')
    })
  })
  it('should fail when package.json cannot be found', () => {
    // Outside of this directory, presumably without a package.json from there to the filesystem root.
    var dir = uniqueTempDir({ create: true })
    var file = path.join(dir, 'file.js')
    return expect(findOptions(file), 'to be rejected').then(msg => {
      return expect(msg, 'to satisfy', 'no package.json found')
    })
  })
})
