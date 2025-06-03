const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const economy = new db.table("Economy");

module.exports = {
    name: 'coinflip',
    aliases: ['cf', 'flip'],
    description: 'Joue à pile ou face avec un montant d\'argent',
    usage: '[pile/face] [montant]',
    run: async (client, message, args) => {
        // Vérifier les arguments
        if (!args[0] || !args[1]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez spécifier pile/face et un montant.\nExemple: \`${config.prefix}coinflip pile 100\``)
                ]
            });
        }

        // Vérifier le choix
        const choice = args[0].toLowerCase();
        if (choice !== 'pile' && choice !== 'face') {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez choisir \`pile\` ou \`face\`.\nExemple: \`${config.prefix}coinflip pile 100\``)
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

        // Lancer la pièce
        const result = Math.random() < 0.5 ? 'pile' : 'face';
        
        // Créer l'embed de base
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({ name: `${message.author.username} joue à pile ou face`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n**Choix:** ${choice}`)
            .setFooter({ text: config.footer })
            .setTimestamp();

        // Envoyer un message initial
        const msg = await message.reply({
            embeds: [
                embed.setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n**Choix:** ${choice}\n\nLa pièce tourne...`)
                    .setImage('https://i.imgur.com/7S06xqh.gif')
            ]
        });

        // Attendre 3 secondes pour l'animation
        setTimeout(() => {
            // Vérifier si l'utilisateur a gagné
            const won = choice === result;
            
            // Calculer les gains
            const winnings = won ? amount * 2 : 0;
            
            // Ajouter les gains au portefeuille si l'utilisateur a gagné
            if (won) {
                economy.add(`wallet_${message.guild.id}_${message.author.id}`, winnings);
            }
            
            // Mettre à jour l'embed
            embed.setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n**Choix:** ${choice}\n**Résultat:** ${result}\n\n${won ? `🎉 Vous avez gagné ${winnings} ${economy.get(`currency_${message.guild.id}`) || '💰'}!` : `😢 Vous avez perdu ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}.`}`)
                .setImage(result === 'pile' ? 'https://i.imgur.com/HyvVM8W.png' : 'https://i.imgur.com/uAsltSk.png');
            
            // Mettre à jour le message
            msg.edit({ embeds: [embed] });
        }, 3000);
    }
};