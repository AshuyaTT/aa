const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const profiles = new db.table("Profiles");

module.exports = {
    name: 'setbio',
    usage: 'setbio [texte]',
    description: `Permet de définir votre biographie.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier si un texte a été fourni
        if (!args[0]) {
            return message.reply(`Veuillez fournir un texte pour votre biographie. Exemple : \`${pf}setbio Salut, je suis un passionné de jeux vidéo !\``);
        }

        // Récupérer le texte de la biographie
        const bioText = args.join(' ');

        // Vérifier la longueur de la biographie
        if (bioText.length > 250) {
            return message.reply(`Votre biographie est trop longue. Elle ne doit pas dépasser 250 caractères. (Actuellement : ${bioText.length} caractères)`);
        }

        // Enregistrer la biographie
        profiles.set(`bio_${message.guild.id}_${message.author.id}`, bioText);

        // Créer l'embed de confirmation
        const embed = new Discord.MessageEmbed()
            .setTitle('Biographie mise à jour')
            .setDescription(`Votre biographie a été mise à jour avec succès.`)
            .addField('Nouvelle biographie', bioText)
            .setColor(color)
            .setFooter({ text: config.bot.footer });

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};