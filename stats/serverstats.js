const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const moment = require('moment');

module.exports = {
    name: 'serverstats',
    aliases: ['serverinfo', 'serveur-stats', 'server'],
    description: 'Affiche les statistiques du serveur',
    run: async (client, message, args) => {
        const guild = message.guild;
        
        // Récupérer les statistiques de base
        const memberCount = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const humanCount = memberCount - botCount;
        const onlineCount = guild.presences.cache.filter(presence => presence.status !== 'offline').size;
        
        // Statistiques des salons
        const channelCount = guild.channels.cache.size;
        const textChannelCount = guild.channels.cache.filter(channel => channel.type === 'GUILD_TEXT').size;
        const voiceChannelCount = guild.channels.cache.filter(channel => channel.type === 'GUILD_VOICE').size;
        const categoryCount = guild.channels.cache.filter(channel => channel.type === 'GUILD_CATEGORY').size;
        
        // Statistiques des rôles
        const roleCount = guild.roles.cache.size - 1; // -1 pour exclure @everyone
        
        // Statistiques des emojis
        const emojiCount = guild.emojis.cache.size;
        const animatedEmojiCount = guild.emojis.cache.filter(emoji => emoji.animated).size;
        const staticEmojiCount = emojiCount - animatedEmojiCount;
        
        // Statistiques des boosts
        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostLevel = guild.premiumTier ? guild.premiumTier.replace('TIER_', '') : 0;
        
        // Statistiques de création
        const creationDate = moment(guild.createdAt).format('DD/MM/YYYY');
        const creationTime = moment(guild.createdAt).format('HH:mm:ss');
        const age = moment.duration(Date.now() - guild.createdAt).humanize();
        
        // Statistiques du propriétaire
        const owner = await guild.fetchOwner();
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setTitle(`Statistiques de ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addField('📊 Informations générales', [
                `**ID:** ${guild.id}`,
                `**Propriétaire:** ${owner.user.tag}`,
                `**Créé le:** ${creationDate} à ${creationTime}`,
                `**Âge:** ${age}`,
                `**Région:** ${guild.preferredLocale}`
            ].join('\n'))
            .addField('👥 Membres', [
                `**Total:** ${memberCount}`,
                `**Humains:** ${humanCount}`,
                `**Bots:** ${botCount}`,
                `**En ligne:** ${onlineCount}`
            ].join('\n'), true)
            .addField('💬 Salons', [
                `**Total:** ${channelCount}`,
                `**Textuels:** ${textChannelCount}`,
                `**Vocaux:** ${voiceChannelCount}`,
                `**Catégories:** ${categoryCount}`
            ].join('\n'), true)
            .addField('🏷️ Autres', [
                `**Rôles:** ${roleCount}`,
                `**Emojis:** ${emojiCount} (${staticEmojiCount} statiques, ${animatedEmojiCount} animés)`,
                `**Boosts:** ${boostCount} (Niveau ${boostLevel})`
            ].join('\n'), true)
            .setFooter({ text: config.footer })
            .setTimestamp();
        
        // Ajouter la bannière si elle existe
        if (guild.banner) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 4096 }));
        }
        
        // Envoyer l'embed
        message.reply({ embeds: [embed] });
    }
};