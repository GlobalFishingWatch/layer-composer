import multiInput from 'rollup-plugin-multi-input'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const distFolder = pkg.main.split('/')[0]
const isProduction = process.env.NODE_ENV === 'production'

export default [
  {
    input: './src/fourwings-worker/index.js',
    output: {
      file: './workers-dist/fourwings-worker.js',
      format: 'iife',
      sourcemap: true,
      name: 'FourWingsWorker',
    },
    plugins: [resolve(), commonjs()],
  },
  {
    input: ['./src/index.js'],
    output: {
      dir: distFolder,
      format: 'esm',
      sourcemap: !isProduction,
    },
    plugins: [
      multiInput(),
      babel({ exclude: 'node_modules/**' }),
      resolve(),
      commonjs({ include: 'node_modules/**' }),
      replace({
        'process.env.MAP_REDUX_REMOTE_DEBUG': process.env.MAP_REDUX_REMOTE_DEBUG === 'true',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
      isProduction &&
      terser({
        // TODO: improve this as layer manager generators are crashing with:
        // "Cannot call a class as a function" but can't find the reason why
        // so this increases a 30kb the bundle sizes but at least it works
        keep_fnames: true,
      }),
    ]
  }
]