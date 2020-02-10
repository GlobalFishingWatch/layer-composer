#!/usr/bin/env node

// This is meant to be executed at parent project level
// ie add to your parent project package.json scripts:
// "copy-workers": "./node_modules/@globalfishingwatch/mlayer-composer/scripts/copy-workers.js"
// or
// "copy-workers:watch": "./node_modules/@globalfishingwatch/mlayer-composer/scripts/copy-workers.js --watch"

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const pkg = require('../package.json')
const distFolder = pkg.main.split('/')[0]
const { workerName, libraryName } = pkg
const dest = `public/${workerName}.js`
const source = `./node_modules/@globalfishingwatch/${libraryName}/${distFolder}/workers/${workerName}.js`

const dests = [dest]
const sources = [source]
if (process.env.NODE_ENV !== 'production') {
  dests.push(`${dest}.map`)
  sources.push(`${source}.map`)
}

const cp = () => {
  dests.forEach((_, i) => {
    fs.copyFileSync(sources[i], dests[i])
  })
  console.log(`Copied ${libraryName} dist worker to public folder 👍 ${source} -> ${dest} `)
}

cp()
const args = process.argv.slice(2)
if (args[0] === '--watch') {
  fs.watchFile(source, () => {
    cp()
  })
}
