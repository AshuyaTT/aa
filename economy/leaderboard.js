const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'ecoleaderboard',
    aliases: ['ecolb', 'richest'],
    usage: 'ecoleaderboard',
    description: `Permet d'afficher le classement des utilisateurs les plus riches du serveur.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Récupérer le symbole de la monnaie
        let currency = economy.get(`currency_${message.guild.id}`) || "💰";

        // Récupérer tous les utilisateurs qui ont de l'argent
        const allUsers = economy.all().filter(data => data.ID.startsWith(`balance_${message.guild.id}_`));
        
        // Récupérer tous les utilisateurs qui ont de l'argent en banque
        const allBankUsers = economy.all().filter(data => data.ID.startsWith(`bank_${message.guild.id}_`));
        
        // Créer un objet pour stocker le total de chaque utilisateur
        const userTotals = {};
        
        // Ajouter l'argent du portefeuille
        for (const userData of allUsers) {
            const userId = userData.ID.split('_')[2];
            userTotals[userId] = (userTotals[userId] || 0) + userData.data;
        }
        
        // Ajouter l'argent en banque
        for (const userData of allBankUsers) {
            const userId = userData.ID.split('_')[2];
            userTotals[userId] = (userTotals[userId] || 0) + userData.data;
        }
        
        // Convertir en tableau et trier
        const sortedUsers = Object.entries(userTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Prendre les 10 premiers
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Classement des plus riches de ${message.guild.name}`)
            .setColor(color)
            .setFooter({ text: config.bot.footer });
        
        // Si aucun utilisateur n'a d'argent
        if (sortedUsers.length === 0) {
            embed.setDescription(`Personne n'a encore d'argent sur ce serveur.`);
            return message.channel.send({ embeds: [embed] });
        }
        
        // Créer la liste des utilisateurs
        let description = '';
        for (let i = 0; i < sortedUsers.length; i++) {
            const userId = sortedUsers[i][0];
            const total = sortedUsers[i][1];
            
            // Récupérer l'utilisateur
            const user = await client.users.fetch(userId).catch(() => null);
            if (user) {
                // Médailles pour les 3 premiers
                let medal = '';
                if (i === 0) medal = '🥇 ';
                else if (i === 1) medal = '🥈 ';
                else if (i === 2) medal = '🥉 ';
                
                description += `${medal}**${i + 1}.** ${user.username} - ${total} ${currency}\n`;
            }
        }
        
        embed.setDescription(description);
        
        // Trouver la position de l'utilisateur qui a envoyé la commande
        const userIndex = sortedUsers.findIndex(user => user[0] === message.author.id);
        if (userIndex !== -1) {
            embed.addField('Votre position', `**${userIndex + 1}.** avec ${sortedUsers[userIndex][1]} ${currency}`);
        } else {
            // Récupérer le solde de l'utilisateur
            let balance = economy.get(`balance_${message.guild.id}_${message.author.id}`) || 0;
            let bank = economy.get(`bank_${message.guild.id}_${message.author.id}`) || 0;
            let total = balance + bank;
            
            if (total === 0) {
                embed.addField('Votre position', `Vous n'avez pas encore d'argent.`);
            } else {
                embed.addField('Votre position', `En dehors du top 10 avec ${total} ${currency}`);
            }
        }
        
        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};