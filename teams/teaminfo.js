const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");
const moment = require('moment');

module.exports = {
    name: 'teaminfo',
    aliases: ['team', 'teamstats'],
    usage: 'teaminfo [nom]',
    category: "teams",
    description: `Permet d'afficher les informations d'une équipe.`,
    async execute(client, message, args) {
        let color = db.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur;

        let teamName;
        
        // Si un nom d'équipe est fourni, l'utiliser
        if (args[0]) {
            teamName = args[0].toLowerCase();
        } else {
            // Sinon, utiliser l'équipe de l'utilisateur
            const userTeam = teams.get(`user_${message.guild.id}_${message.author.id}`);
            if (!userTeam) {
                return message.reply({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setColor(color)
                            .setDescription(`❌ Vous n'êtes pas dans une équipe. Veuillez spécifier le nom d'une équipe.`)
                            .setFooter({ text: config.bot.footer })
                    ]
                });
            }
            teamName = userTeam;
        }

        // Récupérer les données de l'équipe
        const teamData = teams.get(`team_${message.guild.id}_${teamName}`);
        if (!teamData) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Aucune équipe trouvée avec le nom "${args[0] || teamName}".`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Récupérer le rôle de l'équipe
        const teamRoleId = teams.get(`teamrole_${message.guild.id}_${teamName}`);
        let teamRole = null;
        if (teamRoleId) {
            teamRole = await message.guild.roles.fetch(teamRoleId).catch(() => null);
        }

        // Récupérer les informations sur le propriétaire
        const owner = await client.users.fetch(teamData.owner).catch(() => null);
        const ownerName = owner ? owner.tag : 'Utilisateur inconnu';

        // Récupérer les informations sur les administrateurs
        let adminList = '';
        if (teamData.admins && teamData.admins.length > 0) {
            const adminPromises = teamData.admins.map(id => client.users.fetch(id).catch(() => null));
            const admins = await Promise.all(adminPromises);
            adminList = admins.filter(admin => admin !== null).map(admin => admin.tag).join('\n');
        }

        // Récupérer les informations sur les membres
        let memberCount = teamData.members.length;
        let memberList = '';
        
        // Limiter à 10 membres pour éviter les embeds trop longs
        const displayLimit = 10;
        if (memberCount > 0) {
            const memberPromises = teamData.members.slice(0, displayLimit).map(id => client.users.fetch(id).catch(() => null));
            const members = await Promise.all(memberPromises);
            memberList = members.filter(member => member !== null).map(member => {
                if (member.id === teamData.owner) {
                    return `👑 ${member.tag} (Propriétaire)`;
                } else if (teamData.admins && teamData.admins.includes(member.id)) {
                    return `⭐ ${member.tag} (Admin)`;
                } else {
                    return `👤 ${member.tag}`;
                }
            }).join('\n');
            
            if (memberCount > displayLimit) {
                memberList += `\n*...et ${memberCount - displayLimit} autres membres*`;
            }
        }

        // Créer l'embed avec les informations de l'équipe
        const embed = new Discord.MessageEmbed()
            .setColor(teamRole ? teamRole.color : color)
            .setTitle(`Équipe: ${teamData.name}`)
            .setDescription(teamData.description)
            .addFields(
                { name: '👑 Propriétaire', value: ownerName, inline: true },
                { name: '👥 Membres', value: `${memberCount} membre${memberCount > 1 ? 's' : ''}`, inline: true },
                { name: '🔒 Accès', value: teamData.inviteOnly ? 'Sur invitation uniquement' : 'Ouvert', inline: true },
                { name: '📅 Créée le', value: moment(teamData.createdAt).format('DD/MM/YYYY HH:mm'), inline: true }
            )
            .setFooter({ text: config.bot.footer });

        // Ajouter le champ des administrateurs si nécessaire
        if (adminList) {
            embed.addField('⭐ Administrateurs', adminList, false);
        }

        // Ajouter la liste des membres
        if (memberList) {
            embed.addField('👥 Liste des membres', memberList, false);
        }

        // Ajouter le rôle de l'équipe si existant
        if (teamRole) {
            embed.addField('🏷️ Rôle', teamRole.toString(), true);
        }

        return message.reply({ embeds: [embed] });
    }
};