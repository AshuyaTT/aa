const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const moment = require('moment');
const levels = new db.table("Levels");
const economy = new db.table("Economy");
const invites = new db.table("Invites");

module.exports = {
    name: 'userstats',
    aliases: ['userinfo', 'user-stats', 'user'],
    description: 'Affiche les statistiques d\'un utilisateur',
    usage: '[utilisateur]',
    run: async (client, message, args) => {
        // Récupérer l'utilisateur cible
        let target = message.mentions.members.first() 
            || message.guild.members.cache.get(args[0]) 
            || message.member;
        
        // Récupérer les statistiques de base
        const joinedAt = moment(target.joinedAt).format('DD/MM/YYYY à HH:mm:ss');
        const joinedAgo = moment.duration(Date.now() - target.joinedAt).humanize();
        const createdAt = moment(target.user.createdAt).format('DD/MM/YYYY à HH:mm:ss');
        const createdAgo = moment.duration(Date.now() - target.user.createdAt).humanize();
        
        // Statistiques des rôles
        const roles = target.roles.cache
            .filter(role => role.id !== message.guild.id) // Exclure @everyone
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());
        
        // Statistiques de niveau
        const level = levels.get(`level_${message.guild.id}_${target.id}`) || 0;
        const xp = levels.get(`xp_${message.guild.id}_${target.id}`) || 0;
        
        // Statistiques d'économie
        const wallet = economy.get(`wallet_${message.guild.id}_${target.id}`) || 0;
        const bank = economy.get(`bank_${message.guild.id}_${target.id}`) || 0;
        const currency = economy.get(`currency_${message.guild.id}`) || '💰';
        
        // Statistiques d'invitation
        const inviteCount = invites.get(`inviteCount_${message.guild.id}_${target.id}`) || 0;
        const inviterId = invites.get(`inviter_${message.guild.id}_${target.id}`);
        let inviterTag = "Inconnu";
        if (inviterId) {
            const inviter = await client.users.fetch(inviterId).catch(() => null);
            if (inviter) inviterTag = inviter.tag;
        }
        
        // Badges Discord
        const flags = target.user.flags ? target.user.flags.toArray() : [];
        const badges = {
            DISCORD_EMPLOYEE: '<:staff:876862563011186688>',
            PARTNERED_SERVER_OWNER: '<:partner:876862563011186688>',
            HYPESQUAD_EVENTS: '<:hypesquad_events:876862563011186688>',
            BUGHUNTER_LEVEL_1: '<:bughunter:876862563011186688>',
            HOUSE_BRAVERY: '<:bravery:876862563011186688>',
            HOUSE_BRILLIANCE: '<:brilliance:876862563011186688>',
            HOUSE_BALANCE: '<:balance:876862563011186688>',
            EARLY_SUPPORTER: '<:early_supporter:876862563011186688>',
            TEAM_USER: '<:team_user:876862563011186688>',
            BUGHUNTER_LEVEL_2: '<:bughunter_gold:876862563011186688>',
            VERIFIED_BOT: '<:verified_bot:876862563011186688>',
            EARLY_VERIFIED_BOT_DEVELOPER: '<:verified_developer:876862563011186688>',
            DISCORD_CERTIFIED_MODERATOR: '<:certified_moderator:876862563011186688>',
            BOT_HTTP_INTERACTIONS: '<:bot_http_interactions:876862563011186688>'
        };
        
        const userBadges = flags.length ? 
            flags.map(flag => badges[flag] || `\`${flag}\``).join(' ') : 
            'Aucun badge';
        
        // Statut personnalisé
        const activities = target.presence ? target.presence.activities : [];
        const customStatus = activities.find(activity => activity.type === 'CUSTOM');
        const customStatusText = customStatus ? 
            `${customStatus.emoji ? `${customStatus.emoji} ` : ''}${customStatus.state || ''}` : 
            'Aucun statut personnalisé';
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(target.displayHexColor === '#000000' ? config.color : target.displayHexColor)
            .setTitle(`Statistiques de ${target.user.tag}`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .addField('📊 Informations générales', [
                `**ID:** ${target.id}`,
                `**Tag Discord:** ${target.user.tag}`,
                `**Surnom:** ${target.nickname || 'Aucun'}`,
                `**Compte créé le:** ${createdAt}`,
                `**Âge du compte:** ${createdAgo}`,
                `**A rejoint le serveur le:** ${joinedAt}`,
                `**Membre depuis:** ${joinedAgo}`
            ].join('\n'))
            .addField('🏆 Statistiques', [
                `**Niveau:** ${level}`,
                `**XP:** ${xp}`,
                `**Argent:** ${wallet + bank} ${currency} (${wallet} ${currency} en poche, ${bank} ${currency} en banque)`,
                `**Invitations:** ${inviteCount}`,
                `**Invité par:** ${inviterTag}`
            ].join('\n'))
            .addField(`🏷️ Rôles [${roles.length}]`, roles.length ? roles.join(' ') : 'Aucun rôle')
            .addField('🎖️ Badges Discord', userBadges)
            .addField('💬 Statut personnalisé', customStatusText)
            .setFooter({ text: config.footer })
            .setTimestamp();
        
        // Ajouter la bannière si elle existe
        if (target.user.banner) {
            embed.setImage(target.user.bannerURL({ dynamic: true, size: 4096 }));
        }
        
        // Envoyer l'embed
        message.reply({ embeds: [embed] });
    }
};