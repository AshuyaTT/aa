const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'pay',
    usage: 'pay [utilisateur] [montant]',
    description: `Permet de transférer de l'argent à un autre utilisateur.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Récupérer le symbole de la monnaie
        let currency = economy.get(`currency_${message.guild.id}`) || "💰";

        // Vérifier si un utilisateur a été mentionné
        if (!args[0]) {
            return message.reply(`Veuillez mentionner un utilisateur. Exemple : \`${pf}pay @utilisateur 100\``);
        }

        // Récupérer l'utilisateur cible
        let target = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!target) {
            return message.reply(`Utilisateur introuvable. Veuillez mentionner un utilisateur valide.`);
        }

        // Vérifier si l'utilisateur essaie de se payer lui-même
        if (target.id === message.author.id) {
            return message.reply(`Vous ne pouvez pas vous transférer de l'argent à vous-même.`);
        }

        // Vérifier si un montant a été spécifié
        if (!args[1]) {
            return message.reply(`Veuillez spécifier un montant. Exemple : \`${pf}pay @utilisateur 100\``);
        }

        // Vérifier si le montant est un nombre valide
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply(`Veuillez spécifier un montant valide (supérieur à 0).`);
        }

        // Récupérer le solde de l'utilisateur
        let balance = economy.get(`balance_${message.guild.id}_${message.author.id}`) || 0;

        // Vérifier si l'utilisateur a assez d'argent
        if (balance < amount) {
            return message.reply(`Vous n'avez pas assez d'argent. Votre solde actuel est de **${balance} ${currency}**.`);
        }

        // Récupérer le solde de la cible
        let targetBalance = economy.get(`balance_${message.guild.id}_${target.id}`) || 0;

        // Transférer l'argent
        economy.subtract(`balance_${message.guild.id}_${message.author.id}`, amount);
        economy.add(`balance_${message.guild.id}_${target.id}`, amount);

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle('Transfert d\'argent')
            .setDescription(`Vous avez transféré **${amount} ${currency}** à ${target}.`)
            .addField('Votre nouveau solde', `${balance - amount} ${currency}`, true)
            .addField(`Solde de ${target.username}`, `${targetBalance + amount} ${currency}`, true)
            .setColor(color)
            .setFooter({ text: config.bot.footer });

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });

        // Envoyer une notification à la cible si elle n'est pas un bot
        if (!target.bot) {
            const notifEmbed = new Discord.MessageEmbed()
                .setTitle('Transfert d\'argent')
                .setDescription(`Vous avez reçu **${amount} ${currency}** de ${message.author}.`)
                .addField('Votre nouveau solde', `${targetBalance + amount} ${currency}`, true)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            target.send({ embeds: [notifEmbed] }).catch(() => {
                // Si l'envoi du DM échoue, ne rien faire
            });
        }
    }
};