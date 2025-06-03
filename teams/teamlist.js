const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const teams = new db.table("Teams");
const moment = require('moment');

module.exports = {
    name: 'teamlist',
    aliases: ['teams', 'listteams'],
    usage: 'teamlist',
    category: "teams",
    description: `Permet d'afficher la liste des équipes du serveur.`,
    async execute(client, message, args) {
        let color = db.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur;

        // Récupérer toutes les clés de la base de données qui commencent par "team_" pour ce serveur
        const allKeys = teams.all().filter(entry => entry.ID.startsWith(`team_${message.guild.id}_`));
        
        // Si aucune équipe n'existe
        if (allKeys.length === 0) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(color)
                        .setDescription(`❌ Aucune équipe n'a été créée sur ce serveur.`)
                        .setFooter({ text: config.bot.footer })
                ]
            });
        }

        // Extraire les données des équipes
        const teamsList = [];
        for (const entry of allKeys) {
            const teamName = entry.ID.replace(`team_${message.guild.id}_`, '');
            const teamData = entry.data;
            
            // Récupérer le propriétaire
            let ownerTag = 'Utilisateur inconnu';
            try {
                const owner = await client.users.fetch(teamData.owner);
                ownerTag = owner.tag;
            } catch (error) {
                // Ignorer les erreurs si l'utilisateur n'est pas trouvé
            }
            
            teamsList.push({
                name: teamData.name,
                memberCount: teamData.members.length,
                owner: ownerTag,
                createdAt: teamData.createdAt,
                inviteOnly: teamData.inviteOnly
            });
        }

        // Trier les équipes par nombre de membres (décroissant)
        teamsList.sort((a, b) => b.memberCount - a.memberCount);

        // Créer l'embed avec la liste des équipes
        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setTitle(`Équipes du serveur ${message.guild.name}`)
            .setDescription(`Il y a actuellement **${teamsList.length}** équipe${teamsList.length > 1 ? 's' : ''} sur ce serveur.`)
            .setFooter({ text: config.bot.footer });

        // Ajouter les équipes à l'embed (maximum 15 pour éviter les embeds trop longs)
        const displayLimit = 15;
        const teamsToDisplay = teamsList.slice(0, displayLimit);
        
        let description = '';
        for (let i = 0; i < teamsToDisplay.length; i++) {
            const team = teamsToDisplay[i];
            description += `**${i+1}. ${team.name}** - ${team.memberCount} membre${team.memberCount > 1 ? 's' : ''}\n`;
            description += `👑 Propriétaire: ${team.owner}\n`;
            description += `🔒 Accès: ${team.inviteOnly ? 'Sur invitation' : 'Ouvert'}\n`;
            description += `📅 Créée le: ${moment(team.createdAt).format('DD/MM/YYYY')}\n\n`;
        }
        
        if (teamsList.length > displayLimit) {
            description += `*...et ${teamsList.length - displayLimit} autre${teamsList.length - displayLimit > 1 ? 's' : ''} équipe${teamsList.length - displayLimit > 1 ? 's' : ''}*`;
        }
        
        embed.setDescription(description);

        // Ajouter des informations sur comment rejoindre ou créer une équipe
        embed.addField('📝 Commandes utiles', 
            `\`${config.bot.prefix}teamcreate [nom] [description]\` - Créer une équipe\n` +
            `\`${config.bot.prefix}teamjoin [nom]\` - Rejoindre une équipe\n` +
            `\`${config.bot.prefix}teaminfo [nom]\` - Voir les détails d'une équipe`
        );

        return message.reply({ embeds: [embed] });
    }
};