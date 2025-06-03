const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const msgStats = new db.table("MessageStats");

module.exports = {
    name: 'messagestats',
    aliases: ['msgstats', 'messages', 'msgs'],
    description: 'Affiche les statistiques des messages du serveur',
    usage: '[utilisateur]',
    run: async (client, message, args) => {
        // Vérifier si un utilisateur est spécifié
        let target = message.mentions.members.first() 
            || message.guild.members.cache.get(args[0]);
        
        // Si un utilisateur est spécifié, afficher ses statistiques de messages
        if (target) {
            // Récupérer les statistiques de messages de l'utilisateur
            const messageCount = msgStats.get(`messageCount_${message.guild.id}_${target.id}`) || 0;
            const channelStats = msgStats.get(`channelStats_${message.guild.id}_${target.id}`) || {};
            
            // Convertir l'objet en tableau pour le tri
            const channelArray = Object.entries(channelStats).map(([channelId, count]) => {
                const channel = message.guild.channels.cache.get(channelId);
                return {
                    name: channel ? channel.name : 'Salon inconnu',
                    count: count,
                    id: channelId
                };
            });
            
            // Trier par nombre de messages (décroissant)
            channelArray.sort((a, b) => b.count - a.count);
            
            // Limiter à 10 salons
            const topChannels = channelArray.slice(0, 10);
            
            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setColor(config.color)
                .setTitle(`Statistiques de messages de ${target.user.tag}`)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`**Total des messages:** ${messageCount}`)
                .setFooter({ text: config.footer })
                .setTimestamp();
            
            // Ajouter les salons les plus actifs
            if (topChannels.length > 0) {
                embed.addField('📊 Salons les plus actifs', topChannels.map((channel, index) => 
                    `${index + 1}. <#${channel.id}> - ${channel.count} message${channel.count > 1 ? 's' : ''}`
                ).join('\n'));
            } else {
                embed.addField('📊 Salons les plus actifs', 'Aucune donnée disponible');
            }
            
            // Envoyer l'embed
            message.reply({ embeds: [embed] });
        } 
        // Sinon, afficher les statistiques globales du serveur
        else {
            // Récupérer les statistiques globales
            const totalMessages = msgStats.get(`totalMessages_${message.guild.id}`) || 0;
            const channelStats = msgStats.get(`serverChannelStats_${message.guild.id}`) || {};
            const userStats = msgStats.get(`serverUserStats_${message.guild.id}`) || {};
            
            // Convertir l'objet des salons en tableau pour le tri
            const channelArray = Object.entries(channelStats).map(([channelId, count]) => {
                const channel = message.guild.channels.cache.get(channelId);
                return {
                    name: channel ? channel.name : 'Salon inconnu',
                    count: count,
                    id: channelId
                };
            });
            
            // Trier par nombre de messages (décroissant)
            channelArray.sort((a, b) => b.count - a.count);
            
            // Limiter à 10 salons
            const topChannels = channelArray.slice(0, 10);
            
            // Convertir l'objet des utilisateurs en tableau pour le tri
            const userArray = Object.entries(userStats).map(([userId, count]) => {
                const user = client.users.cache.get(userId);
                return {
                    name: user ? user.tag : 'Utilisateur inconnu',
                    count: count,
                    id: userId
                };
            });
            
            // Trier par nombre de messages (décroissant)
            userArray.sort((a, b) => b.count - a.count);
            
            // Limiter à 10 utilisateurs
            const topUsers = userArray.slice(0, 10);
            
            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setColor(config.color)
                .setTitle(`Statistiques de messages de ${message.guild.name}`)
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setDescription(`**Total des messages:** ${totalMessages}`)
                .setFooter({ text: config.footer })
                .setTimestamp();
            
            // Ajouter les salons les plus actifs
            if (topChannels.length > 0) {
                embed.addField('📊 Salons les plus actifs', topChannels.map((channel, index) => 
                    `${index + 1}. <#${channel.id}> - ${channel.count} message${channel.count > 1 ? 's' : ''}`
                ).join('\n'), true);
            } else {
                embed.addField('📊 Salons les plus actifs', 'Aucune donnée disponible', true);
            }
            
            // Ajouter les utilisateurs les plus actifs
            if (topUsers.length > 0) {
                embed.addField('👥 Utilisateurs les plus actifs', topUsers.map((user, index) => 
                    `${index + 1}. <@${user.id}> - ${user.count} message${user.count > 1 ? 's' : ''}`
                ).join('\n'), true);
            } else {
                embed.addField('👥 Utilisateurs les plus actifs', 'Aucune donnée disponible', true);
            }
            
            // Envoyer l'embed
            message.reply({ embeds: [embed] });
        }
    }
};