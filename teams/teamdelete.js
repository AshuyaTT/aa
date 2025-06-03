const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");

module.exports = {
    name: 'teamdelete',
    aliases: ['deleteteam', 'teamremove', 'removeteam'],
    usage: 'teamdelete [confirm]',
    category: "teams",
    description: `Permet de supprimer votre équipe.`,
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
        if (teamData.owner !== message.author.id) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Vous n'êtes pas le propriétaire de cette équipe.`)
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
                        .setTitle(`⚠️ Confirmation de suppression`)
                        .setDescription(`Êtes-vous sûr de vouloir supprimer l'équipe **${teamData.name}** ?\nCette action est irréversible.\n\nPour confirmer, tapez \`${message.content} confirm\``)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Récupérer l'ID du rôle de l'équipe
        const teamRoleId = teams.get(`teamrole_${message.guild.id}_${userTeam}`);
        let roleDeleted = false;

        // Supprimer le rôle de l'équipe si existant
        if (teamRoleId) {
            try {
                const teamRole = await message.guild.roles.fetch(teamRoleId);
                if (teamRole) {
                    await teamRole.delete(`Suppression de l'équipe ${teamData.name}`);
                    roleDeleted = true;
                }
            } catch (error) {
                console.error(`Erreur lors de la suppression du rôle de l'équipe ${teamData.name}:`, error);
            }
        }

        // Supprimer les données de l'équipe pour tous les membres
        for (const memberId of teamData.members) {
            teams.delete(`user_${message.guild.id}_${memberId}`);
        }

        // Supprimer les données de l'équipe
        teams.delete(`team_${message.guild.id}_${userTeam}`);
        teams.delete(`teamrole_${message.guild.id}_${userTeam}`);

        return message.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setColor(color)
                    .setTitle(`✅ Équipe supprimée`)
                    .setDescription(`L'équipe **${teamData.name}** a été supprimée avec succès.${roleDeleted ? '\nLe rôle de l\'équipe a également été supprimé.' : ''}`)
                    .setFooter({ text: config.bot.footer })
            ]
        });
    }
};