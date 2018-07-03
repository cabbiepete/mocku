import test from 'tape-promise/tape'
import Module from 'module'

import { mock, unmock } from '../src/'

const _Module: any = Module
const originalLoad = _Module._load

test('Module: hook', (t) => {
  mock('./fixtures/scoped/file', {
    './file2': {
      default: 'mock1'
    }
  })

  t.notEqual(
    originalLoad,
    _Module._load,
    'Module._load should be hooked'
  )

  t.end()
})

test('Module: unhook', (t) => {
  unmock('./fixtures/scoped/file')

  t.equal(
    originalLoad,
    _Module._load,
    'Module._load should be unhooked if there are no mocks'
  )

  t.end()
})

test('scoped file: mock', async (t) => {
  mock('./fixtures/scoped/file', {
    './file2': {
      default: 'mock'
    }
  })

  const { default: result } = await import('./fixtures/scoped/file')

  t.deepEqual(
    result,
    'mock',
    'should mock'
  )
})

test('scoped file: unmock', async (t) => {
  unmock('./fixtures/scoped/file')

  const { default: result } = await import('./fixtures/scoped/file')

  t.deepEqual(
    result,
    'file2',
    'should unmock'
  )
})

test('not scoped file: mock', async (t) => {
  mock('./fixtures/scoped/file', {
    './file2': {
      default: 'mock'
    }
  })

  const { default: result } = await import('./fixtures/scoped/file3')

  t.deepEqual(
    result,
    'file2',
    'should not mock'
  )

  unmock('./fixtures/scoped/file')
})

test('modules: mock', async (t) => {
  mock('./fixtures/modules/file', {
    fs: {
      readFile: 'readFile'
    },
    '@babel/core': {
      transform: 'babel'
    }
  })

  const { readFile, transform } = await import('./fixtures/modules/file')

  t.equal(
    readFile,
    'readFile',
    'should mock builtin module'
  )

  t.equal(
    transform,
    'babel',
    'should mock external module'
  )
})

test('modules: unmock', async (t) => {
  unmock('./fixtures/modules/file')

  const { readFile, transform } = await import('./fixtures/modules/file')

  t.equal(
    typeof readFile,
    'function',
    'should unmock builtin module'
  )

  t.equal(
    typeof transform,
    'function',
    'should unmock external module'
  )
})
