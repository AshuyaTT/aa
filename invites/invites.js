const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const inviteTracker = require("./inviteTracker");

module.exports = {
    name: 'invites',
    aliases: ['invitation', 'inv'],
    description: 'Affiche les statistiques d\'invitation d\'un utilisateur',
    usage: '[utilisateur]',
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

        // Récupérer l'utilisateur cible
        let target = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!target) target = message.author;

        // Récupérer le nombre d'invitations
        const inviteCount = inviteTracker.getInviteCount(message.guild.id, target.id);
        
        // Récupérer les utilisateurs invités
        const invitedUsers = inviteTracker.getInvitedUsers(message.guild.id, target.id);
        
        // Récupérer l'inviteur
        const inviterId = inviteTracker.getInviter(message.guild.id, target.id);
        const inviter = inviterId ? await client.users.fetch(inviterId).catch(() => null) : null;

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({ name: `Invitations de ${target.username}`, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addField('📊 Statistiques', [
                `**Invitations totales**: ${inviteCount}`,
                `**Membres invités**: ${invitedUsers.length}`,
                `**Invité par**: ${inviter ? `${inviter.tag}` : 'Inconnu'}`
            ].join('\n'))
            .setFooter({ text: `${config.footer}` })
            .setTimestamp();

        // Ajouter les 5 derniers membres invités s'il y en a
        if (invitedUsers.length > 0) {
            const recentInvites = invitedUsers.slice(-5).reverse(); // 5 dernières invitations
            const invitedList = await Promise.all(recentInvites.map(async (invite, index) => {
                const invitedUser = await client.users.fetch(invite.invitedId).catch(() => null);
                if (!invitedUser) return `${index + 1}. Utilisateur inconnu`;
                
                const date = new Date(invite.timestamp);
                const formattedDate = `${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
                return `${index + 1}. **${invitedUser.tag}** (${formattedDate})`;
            }));
            
            embed.addField('🔍 Derniers membres invités', invitedList.join('\n') || 'Aucun membre invité récemment');
        }

        // Envoyer l'embed
        message.reply({ embeds: [embed] });
    }
};