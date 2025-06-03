const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const economy = new db.table("Economy");

module.exports = {
    name: 'rps',
    aliases: ['pfc', 'pierre-feuille-ciseaux'],
    description: 'Joue à pierre-feuille-ciseaux contre le bot',
    usage: '[pierre/feuille/ciseaux] [montant]',
    run: async (client, message, args) => {
        // Vérifier les arguments
        if (!args[0]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez choisir pierre, feuille ou ciseaux.\nExemple: \`${config.prefix}rps pierre 100\``)
                ]
            });
        }

        // Vérifier le choix
        const choices = ['pierre', 'feuille', 'ciseaux'];
        const emojis = {
            'pierre': '🪨',
            'feuille': '📄',
            'ciseaux': '✂️'
        };
        
        let choice = args[0].toLowerCase();
        if (!choices.includes(choice)) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez choisir \`pierre\`, \`feuille\` ou \`ciseaux\`.\nExemple: \`${config.prefix}rps pierre 100\``)
                ]
            });
        }

        // Vérifier si un montant est spécifié
        let amount = 0;
        let betting = false;
        
        if (args[1]) {
            amount = parseInt(args[1]);
            if (!isNaN(amount) && amount > 0) {
                betting = true;
                
                // Récupérer le solde de l'utilisateur
                const wallet = economy.get(`wallet_${message.guild.id}_${message.author.id}`) || 0;
                
                // Vérifier si l'utilisateur a assez d'argent
                if (wallet < amount) {
                    return message.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setColor(config.color)
                                .setDescription(`❌ Vous n'avez pas assez d'argent dans votre portefeuille.\nVous avez: ${wallet} ${economy.get(`currency_${message.guild.id}`) || '💰'}`)
                        ]
                    });
                }
                
                // Retirer l'argent du portefeuille
                economy.subtract(`wallet_${message.guild.id}_${message.author.id}`, amount);
            }
        }

        // Choix du bot
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        
        // Déterminer le gagnant
        let result;
        if (choice === botChoice) {
            result = 'égalité';
        } else if (
            (choice === 'pierre' && botChoice === 'ciseaux') ||
            (choice === 'feuille' && botChoice === 'pierre') ||
            (choice === 'ciseaux' && botChoice === 'feuille')
        ) {
            result = 'gagné';
        } else {
            result = 'perdu';
        }
        
        // Gérer les gains
        let winnings = 0;
        if (betting) {
            if (result === 'gagné') {
                winnings = amount * 2;
                economy.add(`wallet_${message.guild.id}_${message.author.id}`, winnings);
            } else if (result === 'égalité') {
                // Rembourser en cas d'égalité
                economy.add(`wallet_${message.guild.id}_${message.author.id}`, amount);
                winnings = amount; // Pour l'affichage
            }
        }
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({ name: `${message.author.username} joue à pierre-feuille-ciseaux`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .addField('Votre choix', `${emojis[choice]} ${choice}`, true)
            .addField('Choix du bot', `${emojis[botChoice]} ${botChoice}`, true)
            .setFooter({ text: config.footer })
            .setTimestamp();
        
        // Ajouter le résultat
        if (result === 'gagné') {
            embed.setDescription(`🎉 Vous avez gagné!`);
        } else if (result === 'perdu') {
            embed.setDescription(`😢 Vous avez perdu!`);
        } else {
            embed.setDescription(`🤝 Égalité!`);
        }
        
        // Ajouter les informations de paris si applicable
        if (betting) {
            let betField = '';
            if (result === 'gagné') {
                betField = `Vous avez gagné ${winnings} ${economy.get(`currency_${message.guild.id}`) || '💰'}!`;
            } else if (result === 'perdu') {
                betField = `Vous avez perdu ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}.`;
            } else {
                betField = `Vous récupérez votre mise de ${winnings} ${economy.get(`currency_${message.guild.id}`) || '💰'}.`;
            }
            embed.addField('Paris', betField);
        }
        
        // Envoyer l'embed
        message.reply({ embeds: [embed] });
    }
};