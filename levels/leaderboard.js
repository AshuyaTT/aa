const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const levels = new db.table("Levels");

module.exports = {
    name: 'leaderboard',
    usage: 'leaderboard',
    description: `Permet de voir le classement des niveaux du serveur.`,
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

        // Get all users' data for this guild
        const guildData = levels.get(`${message.guild.id}`) || {};
        
        // Convert to array and sort by level and XP
        const usersArray = Object.entries(guildData).map(([userId, data]) => {
            return {
                userId,
                level: data.level || 0,
                xp: data.xp || 0
            };
        });
        
        // Sort by level (descending) and then by XP (descending)
        usersArray.sort((a, b) => {
            if (b.level === a.level) {
                return b.xp - a.xp;
            }
            return b.level - a.level;
        });
        
        // Take top 10
        const topUsers = usersArray.slice(0, 10);
        
        // Create leaderboard text
        let leaderboardText = '';
        
        for (let i = 0; i < topUsers.length; i++) {
            const userData = topUsers[i];
            const user = await client.users.fetch(userData.userId).catch(() => null);
            
            if (user) {
                leaderboardText += `**${i + 1}.** ${user.username} - Niveau ${userData.level} (${userData.xp} XP)\n`;
            }
        }
        
        if (leaderboardText === '') {
            leaderboardText = "Aucun utilisateur n'a encore gagné d'XP sur ce serveur.";
        }
        
        // Create embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Classement des niveaux - ${message.guild.name}`)
            .setDescription(leaderboardText)
            .setColor(color)
            .setFooter({ text: `${config.bot.footer}` });
        
        message.reply({ embeds: [embed] });
    }
};