const { Util } = require("discord.js")
const config = require('../config')
const db = require('quick.db')
const owner = new db.table("Owner")
const p3 = new db.table("Perm3")

module.exports = {
    name: 'emoji',
    usage: 'emoji',
    description: `Permet de créer un émoji`,
    async execute(client, message, args) {

        const perm3 = p3.fetch(`perm3_${message.guild.id}`)
  
        if (owner.get(`owners.${message.author.id}`) || message.member.roles.cache.has(perm3) || config.bot.buyer.includes(message.author.id)   === true) {

            if (!args.length) return message.channel.send({ content: "Veuillez spécifier l'émoji" })

            for (const rawEmoji of args) {
                const parsedEmoji = Util.parseEmoji(rawEmoji)

                if (parsedEmoji.id) {
                    const extension = parsedEmoji.animated ? ".gif" : ".png"
                    const url = `https://cdn.discordapp.com/emojis/${parsedEmoji.id + extension}`
                    message.guild.emojis.create(url, parsedEmoji.name)
                        .then((emoji) => message.channel.send({ content: `1 Emoji Ajouté` }))
                }
            }
        }
    }
}