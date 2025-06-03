const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");

module.exports = {
    name: 'queue',
    usage: 'queue',
    description: `Permet d'afficher la file d'attente des musiques.`,
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
            // Obtenir la liste des musiques dans la file d'attente
            const songs = queue.songs;
            
            if (songs.length === 0) {
                return message.reply(`La file d'attente est vide.`);
            }
            
            // Créer une liste formatée des musiques
            let queueList = '';
            
            // Ajouter la musique en cours de lecture
            queueList += `**En cours de lecture :**\n`;
            queueList += `**${songs[0].name}** - \`${songs[0].formattedDuration}\`\n\n`;
            
            // Ajouter les musiques suivantes (si présentes)
            if (songs.length > 1) {
                queueList += `**File d'attente :**\n`;
                for (let i = 1; i < songs.length; i++) {
                    if (i <= 10) { // Limiter à 10 musiques pour éviter les messages trop longs
                        queueList += `**${i}.** ${songs[i].name} - \`${songs[i].formattedDuration}\`\n`;
                    }
                }
                
                // Indiquer s'il y a plus de musiques que celles affichées
                if (songs.length > 11) {
                    queueList += `\n*Et ${songs.length - 11} autres musiques...*`;
                }
            }
            
            const embed = new Discord.MessageEmbed()
                .setTitle(`🎵 File d'attente de musique`)
                .setDescription(queueList)
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply(`Une erreur est survenue: ${error.message}`);
        }
    }
};