const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");

module.exports = {
    name: 'teaminvite',
    aliases: ['inviteteam', 'teaminv'],
    usage: 'teaminvite <@utilisateur>',
    category: "teams",
    description: `Permet d'inviter un utilisateur dans votre équipe.`,
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

        // Vérifier si l'utilisateur est le propriétaire ou un administrateur de l'équipe
        if (teamData.owner !== message.author.id && !teamData.admins?.includes(message.author.id)) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Seul le propriétaire ou les administrateurs de l'équipe peuvent inviter des membres.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si un utilisateur a été mentionné
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Veuillez mentionner un utilisateur à inviter.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'utilisateur est déjà dans une équipe
        const targetTeam = teams.get(`user_${message.guild.id}_${member.id}`);
        if (targetTeam) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Cet utilisateur est déjà dans une équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'utilisateur est déjà dans cette équipe
        if (teamData.members.includes(member.id)) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Cet utilisateur est déjà membre de votre équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'utilisateur est déjà invité
        if (teamData.invites && teamData.invites.includes(member.id)) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Cet utilisateur a déjà été invité dans votre équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Activer le système d'invitation si ce n'est pas déjà fait
        if (!teamData.inviteOnly) {
            teamData.inviteOnly = true;
        }

        // Initialiser la liste des invitations si elle n'existe pas
        if (!teamData.invites) {
            teamData.invites = [];
        }

        // Ajouter l'utilisateur à la liste des invités
        teamData.invites.push(member.id);
        teams.set(`team_${message.guild.id}_${userTeam}`, teamData);

        // Créer les boutons d'acceptation et de refus
        const acceptButton = new Discord.MessageButton()
            .setCustomId(`team_accept_${message.guild.id}_${userTeam}`)
            .setLabel('Accepter')
            .setStyle('SUCCESS');

        const declineButton = new Discord.MessageButton()
            .setCustomId(`team_decline_${message.guild.id}_${userTeam}`)
            .setLabel('Refuser')
            .setStyle('DANGER');

        const row = new Discord.MessageActionRow().addComponents(acceptButton, declineButton);

        // Envoyer l'invitation à l'utilisateur
        try {
            await member.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(`📨 Invitation à rejoindre une équipe`)
                        .setDescription(`**${message.author.tag}** vous invite à rejoindre l'équipe **${teamData.name}** sur le serveur **${message.guild.name}**.\n\nDescription: ${teamData.description}\n\nVous pouvez accepter ou refuser cette invitation en utilisant les boutons ci-dessous, ou en utilisant la commande \`teamjoin ${teamData.name}\` sur le serveur.`)
                        .setFooter({ text: config.bot.footer })
                ],
                components: [row]
            });

            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(`✅ Invitation envoyée`)
                        .setDescription(`Une invitation à rejoindre l'équipe **${teamData.name}** a été envoyée à **${member.user.tag}**.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        } catch (error) {
            console.error(error);
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(`⚠️ Invitation non envoyée`)
                        .setDescription(`Impossible d'envoyer un message privé à **${member.user.tag}**. Ses messages privés sont peut-être fermés.\n\nL'utilisateur a tout de même été ajouté à la liste des invités et pourra rejoindre l'équipe avec la commande \`teamjoin ${teamData.name}\`.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }
    }
};