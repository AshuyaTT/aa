const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");

module.exports = {
    name: 'teamjoin',
    aliases: ['jointeam'],
    usage: 'teamjoin <nom>',
    category: "teams",
    description: `Permet de rejoindre une équipe.`,
    async execute(client, message, args) {
        let color = db.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur;

        // Vérifier si l'utilisateur a fourni un nom d'équipe
        if (!args[0]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Veuillez fournir le nom de l'équipe que vous souhaitez rejoindre.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        const teamName = args[0].toLowerCase();

        // Vérifier si l'utilisateur est déjà dans une équipe
        const userTeam = teams.get(`user_${message.guild.id}_${message.author.id}`);
        if (userTeam) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Vous êtes déjà dans une équipe. Quittez votre équipe actuelle avant d'en rejoindre une nouvelle.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'équipe existe
        const teamData = teams.get(`team_${message.guild.id}_${teamName}`);
        if (!teamData) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Aucune équipe trouvée avec le nom "${args[0]}".`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'utilisateur est déjà dans cette équipe
        if (teamData.members.includes(message.author.id)) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Vous êtes déjà membre de cette équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'équipe a un système d'invitation activé
        if (teamData.inviteOnly && !teamData.invites?.includes(message.author.id)) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Cette équipe est sur invitation uniquement. Demandez au propriétaire de l'équipe de vous inviter.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Ajouter l'utilisateur à l'équipe
        teamData.members.push(message.author.id);
        teams.set(`team_${message.guild.id}_${teamName}`, teamData);
        teams.set(`user_${message.guild.id}_${message.author.id}`, teamName);

        // Si l'utilisateur était dans la liste des invités, le retirer
        if (teamData.invites && teamData.invites.includes(message.author.id)) {
            teamData.invites = teamData.invites.filter(id => id !== message.author.id);
            teams.set(`team_${message.guild.id}_${teamName}`, teamData);
        }

        // Ajouter le rôle de l'équipe à l'utilisateur si existant
        const teamRoleId = teams.get(`teamrole_${message.guild.id}_${teamName}`);
        let roleAdded = false;

        if (teamRoleId) {
            try {
                const teamRole = await message.guild.roles.fetch(teamRoleId);
                if (teamRole) {
                    await message.member.roles.add(teamRole);
                    roleAdded = true;
                }
            } catch (error) {
                console.error(`Erreur lors de l'ajout du rôle de l'équipe ${teamData.name}:`, error);
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
                            .setTitle(`📢 Nouveau membre dans votre équipe`)
                            .setDescription(`**${message.author.tag}** a rejoint votre équipe **${teamData.name}** sur le serveur **${message.guild.name}**.`)
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
                    .setTitle(`✅ Équipe rejointe`)
                    .setDescription(`Vous avez rejoint l'équipe **${teamData.name}** avec succès.${roleAdded ? '\nLe rôle de l\'équipe vous a été attribué.' : ''}`)
                    .setFooter({ text: config.bot.footer })
            ]
        });
    }
};