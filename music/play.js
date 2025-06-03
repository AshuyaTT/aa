const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");

module.exports = {
    name: 'play',
    usage: 'play [lien/titre]',
    description: `Permet de jouer de la musique depuis YouTube.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier si l'utilisateur est dans un salon vocal
        if (!message.member.voice.channel) {
            return message.reply(`Vous devez être dans un salon vocal pour utiliser cette commande.`);
        }

        // Vérifier si des arguments sont fournis
        if (!args[0]) {
            return message.reply(`Veuillez spécifier un lien ou un titre de musique à jouer.`);
        }

        // Vérifier si DisTube est initialisé
        if (!client.distube) {
            return message.reply(`Le système de musique n'est pas disponible actuellement. Certaines dépendances sont manquantes.`);
        }

        try {
            // Jouer la musique
            client.distube.play(message.member.voice.channel, args.join(' '), {
                member: message.member,
                textChannel: message.channel,
                message
            });
        } catch (error) {
            console.error(error);
            message.reply(`Une erreur est survenue: ${error.message}`);
        }
    }
};