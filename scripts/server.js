#!/usr/bin/env node

const path = require('path')
const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(
  express.static(path.join(__dirname, './data'), {
    setHeaders: (res) => {
      // console.log(res)
      res.set('Content-Encoding', 'gzip')
    },
    // fallthrough: false
  })
)

app.listen(9090)
