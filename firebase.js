const firebase = require('firebase-admin')

console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)
console.log('file')
console.log(require(process.env.GOOGLE_APPLICATION_CREDENTIALS))

firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: process.env.DATABASE,
  storageBucket: process.env.STORAGE
})