require('dotenv').config()

const express = require('express')
const firebase = require('firebase-admin')
const app = express()

console.log(process.env.testvar)

firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: process.env.DATABASE,
  storageBucket: process.env.STORAGE
})

app.get('/', (req, res) => res.send(true))

app.listen(process.env.PORT, () => {
  console.log(`Server listening on http://localhost:${process.env.PORT}`)
  require('./bot')
})
