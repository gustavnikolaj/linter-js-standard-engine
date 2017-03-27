'use strict'
/* global describe, it */

const fs = require('fs')
const path = require('path')

const expect = require('unexpected').clone()
const proxyquire = require('proxyquire').noPreserveCache()

const plugin = require('../../lib/register')
const textEditorFactory = require('../util/textEditorFactory')

const linter = plugin.provideLinter()
const lint = linter.lint.bind(linter)

expect.addAssertion('to be a valid lint report', (expect, subject) => expect(subject, 'to have items satisfying', {
  severity: expect.it('to be a string').and('not to be empty').and('to match', /^[a-z]+$/),
  excerpt: expect.it('to be a string').and('not to be empty'),
  location: expect.it('to exhaustively satisfy', {
    file: expect.it('to be a string').and('to match', /\.js$/),
    position: expect.it('to have items satisfying', 'to have items satisfying', 'to be a number')
  })
}))

describe('linter-js-standard-engine', () => {
  it('should be able to lint a test file', () => {
    const textEditor = textEditorFactory('var foo = "bar"')
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be a valid lint report'))
  })
  it('should be able to lint a test file', () => {
    const textEditor = textEditorFactory({
      source: 'var foo = "bar"',
      path: path.resolve(__dirname, '..', 'fixtures', 'faked', 'foo.js')
    })
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be empty'))
  })
  it('should skip files with the wrong scope', () => {
    const textEditor = textEditorFactory({ source: '# markdown', scopeName: 'source.gfm' })
    return expect(lint(textEditor), 'to be fulfilled').then(data => {
      expect(data, 'to be empty')
    })
  })
  it('should not skip any files if the ignore option is not set', () => {
    const filePath = path.resolve(__dirname, '..', 'fixtures', 'simpleSemiStandard', 'index.js')
    const textEditor = textEditorFactory({
      source: fs.readFileSync(filePath),
      path: filePath
    })
    return expect(lint(textEditor), 'to be fulfilled').then(data => expect(data, 'to be empty'))
  })
  it('should clear all caches when deactivated', () => {
    let cleared = false
    const plugin = proxyquire('../../lib/register', {
      './caches': {
        clearAll () {
          cleared = true
        }
      }
    })

    expect(cleared, 'to be false')
    plugin.deactivate()
    expect(cleared, 'to be true')
  })
  it('should register a restart command', () => {
    atom.commands._commands = []
    proxyquire('../../lib/register', {})
    const commands = require('../../lib/commands')

    expect(atom.commands._commands, 'to have key', 'atom-workspace')
    expect(atom.commands._commands['atom-workspace'], 'to contain', {
      name: 'Standard Engine:Restart',
      callback: commands['Standard Engine:Restart'],
      disposed: false
    })
  })
  it('should register a fix command', () => {
    atom.commands._commands = []
    proxyquire('../../lib/register', {})
    const commands = require('../../lib/commands')

    expect(atom.commands._commands, 'to have key', 'atom-workspace')
    expect(atom.commands._commands['atom-workspace'], 'to contain', {
      name: 'Standard Engine:Fix File',
      callback: commands['Standard Engine:Fix File'],
      disposed: false
    })
  })
  it('should dispose commands when deactivated', () => {
    atom.commands._commands = []
    const plugin = proxyquire('../../lib/register', {})

    let states = []
    for (const target in atom.commands._commands) {
      for (const { disposed } of atom.commands._commands[target]) {
        states.push(disposed)
      }
    }
    expect(states, 'to equal', [false, false])

    plugin.deactivate()
    states = []
    for (const target in atom.commands._commands) {
      for (const { disposed } of atom.commands._commands[target]) {
        states.push(disposed)
      }
    }
    expect(states, 'to equal', [true, true])
  })
  it('should provide an error reporter when linting', () => {
    let actual
    const { lint } = proxyquire('../../lib/register', {
      './linting': {
        lint (textEditor, reportError) {
          actual = reportError
          return new Promise(() => {})
        }
      }
    }).provideLinter()

    lint(textEditorFactory(''))
    expect(actual, 'to be', require('../../lib/reportError'))
  })
})
