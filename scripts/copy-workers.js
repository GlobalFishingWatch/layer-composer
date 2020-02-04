#!/usr/bin/env node

// This is meant to be executed at parent project level
// ie add to your parent project package.json scripts:
// "copy-workers": "./node_modules/@globalfishingwatch/map-styler/scripts/copy-workers.js"
// or
// "copy-workers:watch": "./node_modules/@globalfishingwatch/map-styler/scripts/copy-workers.js --watch"

const fs = require('fs')
const args = process.argv.slice(2)

const dest = 'public/fourwings-worker.js'
const source = './node_modules/@globalfishingwatch/map-styler/dist-workers/fourwings-worker.js'

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
  console.log(`Copied map-styler dist worker to public folder 👍 ${source} -> ${dest} `)
}

cp()
if (args[0] === '--watch') {
  fs.watchFile(source, () => {
    cp()
  })
}
