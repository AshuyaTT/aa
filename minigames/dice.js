const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const economy = new db.table("Economy");

module.exports = {
    name: 'dice',
    aliases: ['dé', 'de'],
    description: 'Lance un dé et parie sur le résultat',
    usage: '[nombre 1-6] [montant]',
    run: async (client, message, args) => {
        // Vérifier les arguments
        if (!args[0] || !args[1]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez spécifier un nombre (1-6) et un montant.\nExemple: \`${config.prefix}dice 6 100\``)
                ]
            });
        }

        // Vérifier le choix
        const choice = parseInt(args[0]);
        if (isNaN(choice) || choice < 1 || choice > 6) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez choisir un nombre entre 1 et 6.\nExemple: \`${config.prefix}dice 6 100\``)
                ]
            });
        }

        // Vérifier le montant
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez spécifier un montant valide supérieur à 0.`)
                ]
            });
        }

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

        // Créer l'embed de base
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({ name: `${message.author.username} lance un dé`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n**Choix:** ${choice}`)
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Envoyer un message initial
        const msg = await message.reply({
            embeds: [
                embed.setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n**Choix:** ${choice}\n\nLe dé roule...`)
                    .setImage('https://i.imgur.com/7PC8DTe.gif')
            ]
        });

        // Attendre 3 secondes pour l'animation
        setTimeout(() => {
            // Lancer le dé
            const result = Math.floor(Math.random() * 6) + 1;
            
            // Vérifier si l'utilisateur a gagné
            const won = choice === result;
            
            // Calculer les gains (multiplier par 6 si gagné)
            const winnings = won ? amount * 6 : 0;
            
            // Ajouter les gains au portefeuille si l'utilisateur a gagné
            if (won) {
                economy.add(`wallet_${message.guild.id}_${message.author.id}`, winnings);
            }
            
            // Obtenir l'image du dé
            const diceImages = {
                1: 'https://i.imgur.com/NWTQhf5.png',
                2: 'https://i.imgur.com/Vy2gC9z.png',
                3: 'https://i.imgur.com/m3Qpu0c.png',
                4: 'https://i.imgur.com/qoUJgQz.png',
                5: 'https://i.imgur.com/OQtJPl6.png',
                6: 'https://i.imgur.com/9dZNzUd.png'
            };
            
            // Mettre à jour l'embed
            embed.setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n**Choix:** ${choice}\n**Résultat:** ${result}\n\n${won ? `🎉 Vous avez gagné ${winnings} ${economy.get(`currency_${message.guild.id}`) || '💰'}!` : `😢 Vous avez perdu ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}.`}`)
                .setImage(diceImages[result]);
            
            // Mettre à jour le message
            msg.edit({ embeds: [embed] });
        }, 3000);
    }
};