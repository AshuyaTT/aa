const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'balance',
    usage: 'balance [utilisateur]',
    description: `Permet de vérifier son solde ou celui d'un autre utilisateur.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Déterminer l'utilisateur cible
        let target = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!target) target = message.author;

        // Récupérer le solde de l'utilisateur
        let balance = economy.get(`balance_${message.guild.id}_${target.id}`) || 0;
        let bank = economy.get(`bank_${message.guild.id}_${target.id}`) || 0;
        let total = balance + bank;

        // Récupérer le symbole de la monnaie
        let currency = economy.get(`currency_${message.guild.id}`) || "💰";

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Solde de ${target.username}`)
            .addField(`Portefeuille`, `${balance} ${currency}`, true)
            .addField(`Banque`, `${bank} ${currency}`, true)
            .addField(`Total`, `${total} ${currency}`, true)
            .setColor(color)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: config.bot.footer });

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};