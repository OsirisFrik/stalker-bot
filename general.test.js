require('dotenv').config()
require('./firebase')
const firebase = require('firebase-admin')

test('ENV', () => {
  let errs = []
  let envs = [
    'DISCORD_TOKEN',
    'DATABASE',
    'STORAGE',
    'GOOGLE_APPLICATION_CREDENTIALS'
  ]
  for (let i = 0; i < envs.length; i++) {
    if (typeof process.env[envs[i]] === 'undefined') {
      errs.push(`ENV ${envs[i]} DON\'T FOUND`)
    }
  }
  return errs.length > 0 ? Promise.reject(errs) : Promise.resolve()
})

test('Firebase', async () => {
  try {
    firebase.app().securityRules()
    return Promise.resolve('OK')
  } catch (err) {
    return Promise.reject(err)
  }
})