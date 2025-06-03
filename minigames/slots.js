const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const economy = new db.table("Economy");

module.exports = {
    name: 'slots',
    aliases: ['slot', 'machine'],
    description: 'Joue à la machine à sous',
    usage: '[montant]',
    run: async (client, message, args) => {
        // Vérifier le montant
        if (!args[0]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez spécifier un montant à miser.\nExemple: \`${config.prefix}slots 100\``)
                ]
            });
        }

        const amount = parseInt(args[0]);
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

        // Symboles de la machine à sous
        const symbols = ['🍒', '🍊', '🍋', '🍇', '🍉', '💰', '💎', '7️⃣'];
        
        // Probabilités (plus l'index est élevé, plus le symbole est rare)
        const weights = [30, 25, 20, 15, 10, 5, 3, 2];
        
        // Fonction pour sélectionner un symbole aléatoire basé sur les poids
        function getRandomSymbol() {
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.floor(Math.random() * totalWeight);
            
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random < 0) {
                    return symbols[i];
                }
            }
            
            return symbols[0]; // Fallback
        }
        
        // Générer les résultats
        const results = [
            [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
            [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
            [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
        ];
        
        // Vérifier les lignes gagnantes (horizontales uniquement pour simplifier)
        const winningLines = [];
        let multiplier = 0;
        
        // Vérifier chaque ligne
        for (let i = 0; i < 3; i++) {
            const line = results[i];
            
            // Si tous les symboles sont identiques
            if (line[0] === line[1] && line[1] === line[2]) {
                winningLines.push(i);
                
                // Ajouter le multiplicateur en fonction du symbole
                const symbolIndex = symbols.indexOf(line[0]);
                const lineMultiplier = symbolIndex + 2; // Plus le symbole est rare, plus le multiplicateur est élevé
                
                multiplier += lineMultiplier;
            }
        }
        
        // Calculer les gains
        const winnings = amount * multiplier;
        
        // Ajouter les gains au portefeuille si le joueur a gagné
        if (winnings > 0) {
            economy.add(`wallet_${message.guild.id}_${message.author.id}`, winnings);
        }
        
        // Créer l'affichage de la machine à sous
        const slotsDisplay = results.map(row => `${row[0]} | ${row[1]} | ${row[2]}`).join('\n');
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setAuthor({ name: `${message.author.username} joue à la machine à sous`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`**Mise:** ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}\n\n${slotsDisplay}`)
            .setFooter({ text: config.footer })
            .setTimestamp();
        
        // Ajouter les informations sur les gains
        if (winnings > 0) {
            embed.addField('Résultat', `🎉 Vous avez gagné ${winnings} ${economy.get(`currency_${message.guild.id}`) || '💰'}!`);
            embed.addField('Lignes gagnantes', winningLines.map(line => `Ligne ${line + 1}`).join(', '));
        } else {
            embed.addField('Résultat', `😢 Vous avez perdu ${amount} ${economy.get(`currency_${message.guild.id}`) || '💰'}.`);
        }
        
        // Envoyer un message initial
        const msg = await message.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setColor(config.color)
                    .setAuthor({ name: `${message.author.username} joue à la machine à sous`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setDescription('Les rouleaux tournent...')
                    .setImage('https://i.imgur.com/Ht8UGKu.gif')
            ]
        });
        
        // Attendre 3 secondes pour l'animation
        setTimeout(() => {
            // Mettre à jour le message avec le résultat
            msg.edit({ embeds: [embed] });
        }, 3000);
    }
};