const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const levels = new db.table("Levels");

module.exports = {
    name: 'rank',
    usage: 'rank [user]',
    description: `Permet de voir le niveau d'un utilisateur.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Check if levels are enabled for this server
        const levelSettings = levels.get(`levelSettings_${message.guild.id}`);
        if (levelSettings !== true) {
            return message.reply(`Les niveaux ne sont pas activés sur ce serveur. Utilisez \`${pf}levelconfig\` pour les activer.`);
        }

        // Get the target user (mentioned user or message author)
        const user = message.mentions.users.first() || message.author;
        
        // Get user's XP and level
        const userXP = levels.get(`${message.guild.id}.${user.id}.xp`) || 0;
        const userLevel = levels.get(`${message.guild.id}.${user.id}.level`) || 0;
        
        // Calculate XP needed for next level (formula: 100 * current level)
        const xpNeeded = 100 * (userLevel + 1);
        
        // Calculate progress percentage
        const progress = Math.min(Math.floor((userXP / xpNeeded) * 100), 100);
        
        // Create progress bar (20 characters long)
        const progressBarLength = 20;
        const filledLength = Math.floor((progress / 100) * progressBarLength);
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
        
        // Create embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Niveau de ${user.username}`)
            .setColor(color)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Niveau', value: `${userLevel}`, inline: true },
                { name: 'XP', value: `${userXP}/${xpNeeded}`, inline: true },
                { name: 'Progression', value: `${progress}%`, inline: true },
                { name: 'Barre de progression', value: `\`\`\`[${progressBar}]\`\`\`` }
            )
            .setFooter({ text: `${config.bot.footer}` });
        
        message.reply({ embeds: [embed] });
    }
};