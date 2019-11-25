const firebase = require('firebase-admin')

firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: process.env.DATABASE,
  storageBucket: process.env.STORAGE
})