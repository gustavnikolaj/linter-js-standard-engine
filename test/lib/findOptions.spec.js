/* global describe, it */

const path = require('path')

const findUp = require('find-up')
const proxyquire = require('proxyquire').noPreserveCache()
const readPkg = require('read-pkg')
const expect = require('unexpected')
const uniqueTempDir = require('unique-temp-dir')

const caches = require('../../lib/caches')
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
    return expect(findOptions(file), 'to be rejected').then(msg => expect(msg, 'to satisfy', 'No supported linter found'))
  })
  it('should fail when package.json cannot be found', () => {
    // Outside of this directory, presumably without a package.json from there to the filesystem root.
    const dir = uniqueTempDir({ create: true })
    const file = path.join(dir, 'file.js')
    return expect(findOptions(file), 'to be rejected').then(msg => {
      return expect(msg, 'to satisfy', 'No package.json found')
    })
  })
  it('should walk up the tree if a package.json is found stating it\'s not the projects root', () => {
    const file = fixturesPath('multiplePackageJsons/submodule/index.js')
    return expect(findOptions(file), 'to be fulfilled').then(options => expect(options, 'to equal', {
      projectRoot: fixturesPath('multiplePackageJsons'),
      linterName: 'my-linter',
      ignoreGlobs: []
    }))
  })

  describe('caching', () => {
    const findCwds = []
    const readPkgs = []
    const findOptions = proxyquire('../../lib/findOptions', {
      'find-up' (name, { cwd }) {
        findCwds.push(cwd)
        return findUp(name, { cwd })
      },
      'read-pkg' (path) {
        readPkgs.push(path)
        return readPkg(path)
      }
    })

    it('should cache results for the same file', () => {
      return findOptions(__filename).then(options => {
        return expect(findOptions(__filename), 'to be fulfilled').then(cached => expect(cached, 'to be', options))
      })
    })
    it('should cache results for files in the same directory', () => {
      return findOptions(path.join(__dirname, 'lint.spec.js')).then(options => {
        return expect(findOptions(__filename), 'to be fulfilled').then(cached => expect(cached, 'to be', options))
      })
    })

    describe('clearing all caches', () => {
      it('should lead to fresh options', () => {
        return findOptions(__filename).then(options => {
          caches.clearAll()
          return expect(findOptions(__filename), 'to be fulfilled').then(fresh => expect(fresh, 'not to be', options))
        })
      })
    })
  })
})
