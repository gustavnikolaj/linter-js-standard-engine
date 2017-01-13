/* global describe, it */

const expect = require('unexpected')
const uniqueTempDir = require('unique-temp-dir')
const path = require('path')
const findOptions = require('../../lib/findOptions')

function fixturesPath (relativePath) {
  return path.resolve(__dirname, '../fixtures', relativePath)
}

describe('lib/findOptions', () => {
  it('should be able to find options about this module', () => expect(findOptions(__filename), 'to be fulfilled').then(options => expect(options, 'to satisfy', {
    linterName: 'standard',
    ignoreGlobs: ['test/fixtures/faked/*.js']
  })))
  it('should be able to find semistandard listed as devDependency', () => {
    const file = fixturesPath('simpleSemiStandard/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(options => expect(options, 'to equal', {
      projectRoot: fixturesPath('simpleSemiStandard'),
      linterName: 'semistandard',
      ignoreGlobs: []
    }))
  })
  it('should be able to find a linter from the standard-engine package.json key', () => {
    const file = fixturesPath('standardEngineKey/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(options => expect(options, 'to equal', {
      projectRoot: fixturesPath('standardEngineKey'),
      linterName: 'my-linter',
      ignoreGlobs: []
    }))
  })
  it('should read config for scoped linters', () => {
    const file = fixturesPath('scopedLinter/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(options => expect(options, 'to equal', {
      projectRoot: fixturesPath('scopedLinter'),
      linterName: '@my-scope/my-linter',
      ignoreGlobs: ['world']
    }))
  })
  it('should not select a linter for a project with no linter', () => {
    const file = fixturesPath('noStandardEngine/index.js')
    return expect(findOptions(file), 'to be rejected').then(msg => expect(msg, 'to satisfy', 'no supported linter found'))
  })
  it('should fail when package.json cannot be found', () => {
    // Outside of this directory, presumably without a package.json from there to the filesystem root.
    const dir = uniqueTempDir({ create: true })
    const file = path.join(dir, 'file.js')
    return expect(findOptions(file), 'to be rejected').then(msg => {
      return expect(msg, 'to satisfy', 'no package.json found')
    })
  })
})
