const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const inviteTracker = require("./inviteTracker");

module.exports = {
    name: 'invitesleaderboard',
    aliases: ['invitelb', 'toplb', 'topinvites'],
    description: 'Affiche le classement des inviteurs du serveur',
    run: async (client, message, args) => {
        // Vérifier si le système d'invitation est activé
        const inviteEnabled = db.get(`inviteEnabled_${message.guild.id}`);
        if (inviteEnabled === false) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Le système d'invitation est désactivé sur ce serveur.`)
                ]
            });
        }

        // Récupérer tous les membres du serveur
        const members = await message.guild.members.fetch();
        
        // Créer un tableau avec les données d'invitation
        const inviteData = [];
        
        // Pour chaque membre, récupérer son nombre d'invitations
        for (const [id, member] of members) {
            const inviteCount = inviteTracker.getInviteCount(message.guild.id, id);
            if (inviteCount > 0) {
                inviteData.push({
                    id: id,
                    tag: member.user.tag,
                    invites: inviteCount
                });
            }
        }
        
        // Trier le tableau par nombre d'invitations (décroissant)
        inviteData.sort((a, b) => b.invites - a.invites);
        
        // Limiter à 10 utilisateurs
        const topInviters = inviteData.slice(0, 10);
        
        // Si aucun utilisateur n'a d'invitations
        if (topInviters.length === 0) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Aucun utilisateur n'a d'invitations sur ce serveur.`)
                ]
            });
        }
        
        // Créer la liste des inviteurs
        const leaderboardList = topInviters.map((data, index) => {
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            else medal = `${index + 1}.`;
            
            return `${medal} **${data.tag}** - ${data.invites} invitation${data.invites > 1 ? 's' : ''}`;
        });
        
        // Trouver la position de l'auteur du message
        const authorPosition = inviteData.findIndex(data => data.id === message.author.id);
        const authorInvites = inviteTracker.getInviteCount(message.guild.id, message.author.id);
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({ name: `Classement des inviteurs de ${message.guild.name}`, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setDescription(leaderboardList.join('\n'))
            .setFooter({ text: `${config.footer}` })
            .setTimestamp();
        
        // Ajouter la position de l'auteur s'il a des invitations
        if (authorPosition !== -1) {
            embed.addField('📊 Votre position', `${authorPosition + 1}. **${message.author.tag}** - ${authorInvites} invitation${authorInvites > 1 ? 's' : ''}`);
        } else if (authorInvites > 0) {
            embed.addField('📊 Votre position', `**${message.author.tag}** - ${authorInvites} invitation${authorInvites > 1 ? 's' : ''}`);
        } else {
            embed.addField('📊 Votre position', `Vous n'avez pas encore d'invitations.`);
        }
        
        // Envoyer l'embed
        message.reply({ embeds: [embed] });
    }
};