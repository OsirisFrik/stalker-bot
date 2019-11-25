require('dotenv').config()

const express = require('express')
const app = express()

app.get('/', (req, res) => res.send(true))

app.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:${process.env.PORT}`)
  require('./bot')
})
