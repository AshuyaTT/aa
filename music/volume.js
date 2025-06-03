const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");

module.exports = {
    name: 'volume',
    usage: 'volume [1-100]',
    description: `Permet de régler le volume de la musique.`,
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
            // Si aucun argument n'est fourni, afficher le volume actuel
            if (!args[0]) {
                const embed = new Discord.MessageEmbed()
                    .setDescription(`🔊 Volume actuel: **${queue.volume}%**`)
                    .setColor(color)
                    .setFooter({ text: config.bot.footer });
                
                return message.channel.send({ embeds: [embed] });
            }
            
            // Vérifier que l'argument est un nombre entre 1 et 100
            const volume = parseInt(args[0]);
            if (isNaN(volume) || volume < 1 || volume > 100) {
                return message.reply(`Veuillez spécifier un nombre entre 1 et 100.`);
            }
            
            // Régler le volume
            queue.setVolume(volume);
            
            const embed = new Discord.MessageEmbed()
                .setDescription(`🔊 Volume réglé à **${volume}%**`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply(`Une erreur est survenue: ${error.message}`);
        }
    }
};