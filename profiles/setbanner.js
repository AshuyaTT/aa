const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const profiles = new db.table("Profiles");

module.exports = {
    name: 'setbanner',
    usage: 'setbanner [url]',
    description: `Permet de définir la bannière de votre profil.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier si une URL a été fournie
        if (!args[0]) {
            return message.reply(`Veuillez fournir l'URL d'une image pour votre bannière. Exemple : \`${pf}setbanner https://example.com/image.png\``);
        }

        // Récupérer l'URL
        const bannerUrl = args[0];

        // Vérifier si l'URL est valide
        const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;
        if (!urlRegex.test(bannerUrl)) {
            return message.reply(`L'URL fournie n'est pas valide. Assurez-vous qu'elle se termine par .png, .jpg, .jpeg, .gif ou .webp.`);
        }

        // Enregistrer la bannière
        profiles.set(`banner_${message.guild.id}_${message.author.id}`, bannerUrl);

        // Créer l'embed de confirmation
        const embed = new Discord.MessageEmbed()
            .setTitle('Bannière mise à jour')
            .setDescription(`La bannière de votre profil a été mise à jour avec succès.`)
            .setImage(bannerUrl)
            .setColor(color)
            .setFooter({ text: config.bot.footer });

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};