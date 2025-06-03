const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const profiles = new db.table("Profiles");

module.exports = {
    name: 'setcolor',
    usage: 'setcolor [couleur]',
    description: `Permet de définir la couleur de votre profil.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier si une couleur a été fournie
        if (!args[0]) {
            return message.reply(`Veuillez fournir une couleur au format hexadécimal. Exemple : \`${pf}setcolor #FF0000\` pour du rouge.`);
        }

        // Récupérer la couleur
        let colorCode = args[0].toUpperCase();

        // Vérifier si la couleur est au format hexadécimal
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(colorCode)) {
            // Si la couleur ne commence pas par #, l'ajouter
            if (!colorCode.startsWith('#')) {
                colorCode = '#' + colorCode;
            }
            
            // Vérifier à nouveau
            if (!hexColorRegex.test(colorCode)) {
                return message.reply(`La couleur doit être au format hexadécimal. Exemple : \`#FF0000\` pour du rouge.`);
            }
        }

        // Enregistrer la couleur
        profiles.set(`color_${message.guild.id}_${message.author.id}`, colorCode);

        // Créer l'embed de confirmation
        const embed = new Discord.MessageEmbed()
            .setTitle('Couleur mise à jour')
            .setDescription(`La couleur de votre profil a été mise à jour avec succès.`)
            .addField('Nouvelle couleur', colorCode)
            .setColor(colorCode)
            .setFooter({ text: config.bot.footer });

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};