const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");

module.exports = {
    name: 'skip',
    usage: 'skip',
    description: `Permet de passer à la musique suivante.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier si l'utilisateur est dans un salon vocal
        if (!message.member.voice.channel) {
            return message.reply(`Vous devez être dans un salon vocal pour utiliser cette commande.`);
        }

        // Vérifier si DisTube est initialisé
        if (!client.distube) {
            return message.reply(`Aucune musique n'est en cours de lecture.`);
        }

        // Vérifier s'il y a une file d'attente pour ce serveur
        const queue = client.distube.getQueue(message.guild);
        if (!queue) {
            return message.reply(`Aucune musique n'est en cours de lecture.`);
        }

        try {
            // Passer à la musique suivante
            await queue.skip();
            
            const embed = new Discord.MessageEmbed()
                .setDescription(`⏭️ Musique passée !`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            if (error.message === "There is no up next song") {
                message.reply(`Il n'y a pas de musique suivante dans la file d'attente.`);
            } else {
                message.reply(`Une erreur est survenue: ${error.message}`);
            }
        }
    }
};