const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");

module.exports = {
    name: 'pause',
    usage: 'pause',
    description: `Permet de mettre en pause la lecture de musique.`,
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
            // Vérifier si la musique est déjà en pause
            if (queue.paused) {
                return message.reply(`La musique est déjà en pause. Utilisez \`${pf}resume\` pour reprendre la lecture.`);
            }

            // Mettre en pause la lecture
            queue.pause();
            
            const embed = new Discord.MessageEmbed()
                .setDescription(`⏸️ Lecture mise en pause. Utilisez \`${pf}resume\` pour reprendre.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply(`Une erreur est survenue: ${error.message}`);
        }
    }
};