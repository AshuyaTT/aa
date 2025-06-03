const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");

module.exports = {
    name: 'teamleave',
    aliases: ['leaveteam'],
    usage: 'teamleave [confirm]',
    category: "teams",
    description: `Permet de quitter votre équipe actuelle.`,
    async execute(client, message, args) {
        let color = db.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur;

        // Vérifier si l'utilisateur est dans une équipe
        const userTeam = teams.get(`user_${message.guild.id}_${message.author.id}`);
        if (!userTeam) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Vous n'êtes pas dans une équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Récupérer les données de l'équipe
        const teamData = teams.get(`team_${message.guild.id}_${userTeam}`);
        if (!teamData) {
            // Si les données de l'équipe n'existent pas, nettoyer les données utilisateur
            teams.delete(`user_${message.guild.id}_${message.author.id}`);
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Équipe introuvable. Vos données ont été nettoyées.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'utilisateur est le propriétaire de l'équipe
        if (teamData.owner === message.author.id) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Vous êtes le propriétaire de cette équipe. Utilisez la commande \`teamdelete\` pour supprimer l'équipe ou \`teamtransfer\` pour transférer la propriété à un autre membre.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Demander confirmation si l'argument "confirm" n'est pas fourni
        if (!args[0] || args[0].toLowerCase() !== "confirm") {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(`⚠️ Confirmation de départ`)
                        .setDescription(`Êtes-vous sûr de vouloir quitter l'équipe **${teamData.name}** ?\n\nPour confirmer, tapez \`${message.content} confirm\``)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Retirer l'utilisateur de la liste des membres de l'équipe
        teamData.members = teamData.members.filter(id => id !== message.author.id);
        teams.set(`team_${message.guild.id}_${userTeam}`, teamData);
        teams.delete(`user_${message.guild.id}_${message.author.id}`);

        // Retirer le rôle de l'équipe à l'utilisateur si existant
        const teamRoleId = teams.get(`teamrole_${message.guild.id}_${userTeam}`);
        let roleRemoved = false;

        if (teamRoleId) {
            try {
                const teamRole = await message.guild.roles.fetch(teamRoleId);
                if (teamRole && message.member.roles.cache.has(teamRoleId)) {
                    await message.member.roles.remove(teamRole);
                    roleRemoved = true;
                }
            } catch (error) {
                console.error(`Erreur lors du retrait du rôle de l'équipe ${teamData.name}:`, error);
            }
        }

        // Notifier le propriétaire de l'équipe
        const owner = await client.users.fetch(teamData.owner).catch(() => null);
        if (owner) {
            try {
                await owner.send({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setColor(color)
                            .setTitle(`📢 Membre parti de votre équipe`)
                            .setDescription(`**${message.author.tag}** a quitté votre équipe **${teamData.name}** sur le serveur **${message.guild.name}**.`)
                            .setFooter({ text: config.bot.footer })
                    ]
                });
            } catch (error) {
                // Ignorer les erreurs si le propriétaire a les DMs fermés
            }
        }

        return message.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(`✅ Équipe quittée`)
                    .setDescription(`Vous avez quitté l'équipe **${teamData.name}** avec succès.${roleRemoved ? '\nLe rôle de l\'équipe vous a été retiré.' : ''}`)
                    .setFooter({ text: config.bot.footer })
            ]
        });
    }
};