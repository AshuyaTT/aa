const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");

module.exports = {
    name: 'teamcreate',
    aliases: ['createteam'],
    usage: 'teamcreate <nom> [description]',
    category: "teams",
    description: `Permet de créer une équipe.`,
    async execute(client, message, args) {
        let color = db.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur;

        // Vérifier si l'utilisateur a fourni un nom d'équipe
        if (!args[0]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Veuillez fournir un nom pour votre équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        const teamName = args[0];
        const teamDescription = args.slice(1).join(' ') || 'Aucune description fournie.';

        // Vérifier si l'équipe existe déjà
        const existingTeam = teams.get(`team_${message.guild.id}_${teamName.toLowerCase()}`);
        if (existingTeam) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Une équipe avec ce nom existe déjà.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Vérifier si l'utilisateur est déjà dans une équipe
        const userTeam = teams.get(`user_${message.guild.id}_${message.author.id}`);
        if (userTeam) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Vous êtes déjà dans une équipe. Quittez votre équipe actuelle avant d'en créer une nouvelle.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Créer l'équipe
        const teamData = {
            name: teamName,
            description: teamDescription,
            owner: message.author.id,
            members: [message.author.id],
            createdAt: Date.now()
        };

        // Sauvegarder l'équipe dans la base de données
        teams.set(`team_${message.guild.id}_${teamName.toLowerCase()}`, teamData);
        teams.set(`user_${message.guild.id}_${message.author.id}`, teamName.toLowerCase());

        // Créer un rôle pour l'équipe (optionnel)
        try {
            const teamRole = await message.guild.roles.create({
                name: `Team ${teamName}`,
                color: 'RANDOM',
                reason: `Création de l'équipe ${teamName}`
            });

            // Ajouter le rôle au créateur de l'équipe
            await message.member.roles.add(teamRole);

            // Sauvegarder l'ID du rôle dans la base de données
            teams.set(`teamrole_${message.guild.id}_${teamName.toLowerCase()}`, teamRole.id);

            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(`✅ Équipe créée avec succès !`)
                        .setDescription(`Vous avez créé l'équipe **${teamName}**.\nDescription: ${teamDescription}\n\nUn rôle a été créé pour votre équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        } catch (error) {
            console.error(error);
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle(`✅ Équipe créée avec succès !`)
                        .setDescription(`Vous avez créé l'équipe **${teamName}**.\nDescription: ${teamDescription}\n\nAttention: Impossible de créer un rôle pour votre équipe.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }
    }
};