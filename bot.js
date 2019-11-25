const firebase = require('firebase-admin')
const google = require('@google-cloud/text-to-speech')
const fs = require('fs')
const util = require('util')
const { Client, VoiceChannel } = require('discord.js')

const storage = firebase.storage().bucket()
const db = firebase.database().ref('/skynet')
const client = new Client()

/**
 * @type {VoiceChannel}
 */
var voice
var voiceMessage
var userToStalk
var interval
var intervalTime = 60000

client.on('ready', () => {
  console.log('BOT READY')
  db.once('value', value => {
    data = value.val() || {}
    userToStalk = data.user || null
    if (userToStalk !== null) checkConnections(userToStalk)
  })
})

client.on('message', message => {
  if (message.content.match(/\$stalk <@.?[0-9]{2,}>/g)) {
    try {
      let user = message.mentions.users.first()
      userToStalk = user
      db.update({
        user: {
          id: user.id,
          username: user.username,
          tag: user.tag
        }
      })
      client.user.setActivity(`@${user.id}`, { type: 'WATCHING' })
      // checkVoiceFile(user.id)
      checkConnections(user.id)
      message.delete()
    } catch (err) {
      console.trace(err)
    }
  }

  if (message.content === '$leave') {
    if (voice) disconnect()
    message.delete()
  }

  if (message.content === '$stop') {
    userToStalk = null
    db.update({
      user: null
    })
    if (voice) disconnect()
    message.delete()
  }

  if (message.content === '$talk') {
    sendMessage()
  }
})

client.on('voiceStateUpdate', (oldUser, newUser) => {
  if (userToStalk !== null) {
    if (newUser.voiceChannelID !== null && newUser.id === userToStalk.id && voice !== newUser.voiceChannel) {
      if (voice) {
        disconnect()
      }
      voice = newUser.voiceChannel
      newUser.voiceChannel.join()
        .then(() => console.log('CONNECTED!!'))
        .catch(err => console.trace(err))
    } else if (userToStalk && newUser.id === userToStalk.id && !newUser.voiceChannel) {
      if (voice) {
        disconnect()
      }
    } else if (!userToStalk && voice) {
      disconnect()
    }
  }
})

function checkConnections() {
  let connections = client.channels

  client.user.setActivity(`a @${userToStalk.username}`, { type: 'WATCHING' })

  connections.forEach(channel => {
    if (channel.type === 'voice') {
      channel.members.forEach(user => {
        if (user.id === userToStalk.id && channel.joinable) {
          if (voice) disconnect()
          voice = channel
          try {
            voice.join()
              .then(checkVoiceFile(userToStalk))
            interval = setInterval(() => {
              if (userToStalk) checkVoiceFile()
              else disconnect()
            }, intervalTime);
          } catch (err) {
            console.trace(err)
          }
        }
      })
    }
  })
}

async function sendMessage() {
  try {
    if (voice) {
      let file = await storage.file(`messages/${userToStalk.id}.mp3`)
      if (!file.isPublic) await file.makePublic()
      let url = `https://storage.googleapis.com/${process.env.STORAGE}/messages/${userToStalk.id}_1.mp3`
      voice.connection.playArbitraryInput(url, {
        bitrate: 'auto',
        passes: 10
      })
    }
  } catch (err) {
    console.trace(err)
  }
}

async function checkVoiceFile() {
  let file = await storage.file(`messages/${userToStalk.id}_1.mp3`)
  file.exists((err, exist) => {
    if (!exist) createVoiceMessage(userToStalk)
    else sendMessage()
  })
}

async function createVoiceMessage() {
  if (typeof userToStalk.username !== 'undefined') {
    try {
      let gclient = new google.TextToSpeechClient()
      let data = {
        input: {
          text: `Hola ${userToStalk.username}`
        },
        voice: {
          languageCode: 'es-ES',
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      }
      let [message] = await gclient.synthesizeSpeech(data)
      let writeFile = util.promisify(fs.writeFile)
      let oldUrl = await storage.file(`messages/${userToStalk.id}.mp3`).createResumableUpload().then(uri => uri[0])
      await writeFile(`messages/${userToStalk.id}.mp3`, message.audioContent, 'binary')
      storage.upload(`messages/${userToStalk.id}.mp3`, {
        destination: `messages/${userToStalk.id}_1.mp3`,
        private: false,
        public: true,
        contentType: 'audio/mpeg',
        resumable: oldUrl
      })
      sendMessage()
    } catch (err) {
      console.trace(err)
    }
  }
}

function disconnect() {
  clearInterval(interval)
  voice.leave()
}

client.login(process.env.DISCORD_TOKEN)
