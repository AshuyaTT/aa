const db = require("quick.db")
const config = require('../config')
const Discord = require('discord.js')
const rlog = new db.table("raidlog")
const wl = new db.table("Whitelist")
const p = new db.table("Prefix")
const levels = new db.table("Levels")

module.exports = {
    name: "messageCreate",

    async execute(client, message) {

        if (message.author.bot) return
        if (message.channel.type == "DM") return

        // Level system - XP awarding
        if (levels.get(`levelSettings_${message.guild.id}`) === true) {
            // Get user's current XP and level
            const userXP = levels.get(`${message.guild.id}.${message.author.id}.xp`) || 0;
            const userLevel = levels.get(`${message.guild.id}.${message.author.id}.level`) || 0;
            
            // Get XP rate (multiplier)
            const xpRate = levels.get(`xpRate_${message.guild.id}`) || 1;
            
            // Calculate random XP to award (between 5-15) multiplied by XP rate
            const xpToAdd = Math.floor(Math.random() * 11 + 5) * xpRate;
            
            // Add XP to user
            levels.add(`${message.guild.id}.${message.author.id}.xp`, xpToAdd);
            
            // Calculate XP needed for next level (formula: 100 * current level)
            const xpNeeded = 100 * (userLevel + 1);
            
            // Check if user has leveled up
            if (userXP + xpToAdd >= xpNeeded) {
                // Level up the user
                levels.add(`${message.guild.id}.${message.author.id}.level`, 1);
                // Reset XP to 0
                levels.set(`${message.guild.id}.${message.author.id}.xp`, 0);
                
                // Create level up embed
                const levelUpEmbed = new Discord.MessageEmbed()
                    .setTitle('Niveau Supérieur!')
                    .setDescription(`🎉 Félicitations ${message.author}! Tu es passé au niveau **${userLevel + 1}**!`)
                    .setColor(config.bot.couleur)
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: config.bot.footer });
                
                // Check if level channel is set
                const levelChannel = levels.get(`levelChannel_${message.guild.id}`);
                if (levelChannel) {
                    // Send level up message to designated channel
                    const channel = message.guild.channels.cache.get(levelChannel);
                    if (channel) channel.send({ embeds: [levelUpEmbed] }).catch(() => {});
                } else {
                    // Send level up message to current channel
                    message.channel.send({ embeds: [levelUpEmbed] }).catch(() => {});
                }
            }
        }

        let pf = p.fetch(`prefix_${message.guild.id}`)
        if (pf == null) pf = config.bot.prefixe

        const args = message.content.slice(pf.length).trim().split(' ')
        const commandName = args.shift().toLowerCase()
        const command = client.commands.get(commandName)

        if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`)))
            message.channel.send(`Mon prefix sur le serveur est : \`${pf}\``)

        if (!message.content.startsWith(pf) || message.author.bot) return
        if (!command) return

            command.execute(client, message, args)

    }
}