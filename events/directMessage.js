const Discord = require('discord.js')
const db = require("quick.db")
const config = require('../config')
const modmail = new db.table("Modmail")
const cl = new db.table("Color")

module.exports = {
    name: 'messageCreate',
    once: false,

    async execute(client, message) {
        // Ignorer les messages du bot
        if (message.author.bot) return;
        
        // Vérifier si le message est un DM
        if (message.channel.type !== "DM") return;
        
        // Chercher si l'utilisateur a un ticket ouvert
        let activeTicket = null;
        let ticketGuildId = null;
        
        // Parcourir toutes les entrées de modmail pour trouver le ticket de l'utilisateur
        const guildIds = client.guilds.cache.map(guild => guild.id);
        
        for (const guildId of guildIds) {
            const ticket = modmail.get(`modmail_ticket_${guildId}_${message.author.id}`);
            if (ticket) {
                activeTicket = ticket;
                ticketGuildId = guildId;
                break;
            }
        }
        
        // Si l'utilisateur n'a pas de ticket actif
        if (!activeTicket) {
            // Vérifier si le message est une réponse à un message du bot
            // Si c'est le cas, nous supposons que l'utilisateur souhaite ouvrir un ticket
            const userLastMessages = await message.channel.messages.fetch({ limit: 5 });
            const botMessages = userLastMessages.filter(m => m.author.id === client.user.id);
            
            if (botMessages.size === 0) {
                return message.reply({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setTitle("ModMail")
                            .setDescription(`Pour contacter le staff d'un serveur, vous devez d'abord utiliser la commande \`modmail\` sur le serveur concerné.`)
                            .setColor(config.bot.couleur)
                            .setFooter({ text: config.bot.footer })
                    ]
                });
            }
            
            return;
        }
        
        const guild = client.guilds.cache.get(ticketGuildId);
        if (!guild) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Erreur")
                        .setDescription(`Je n'ai plus accès au serveur associé à votre ticket. Votre ticket a été fermé.`)
                        .setColor(config.bot.couleur)
                        .setFooter({ text: config.bot.footer })
                ]
            });
            
            // Supprimer le ticket
            modmail.delete(`modmail_ticket_${ticketGuildId}_${message.author.id}`);
            return;
        }
        
        const ticketChannel = guild.channels.cache.get(activeTicket.channelId);
        if (!ticketChannel) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Erreur")
                        .setDescription(`Le salon de votre ticket n'existe plus. Votre ticket a été fermé.`)
                        .setColor(config.bot.couleur)
                        .setFooter({ text: config.bot.footer })
                ]
            });
            
            // Supprimer le ticket
            modmail.delete(`modmail_ticket_${ticketGuildId}_${message.author.id}`);
            return;
        }
        
        // Vérifier si le message est "close" pour fermer le ticket
        if (message.content.toLowerCase() === "close") {
            // Informer l'utilisateur
            await message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Ticket Fermé")
                        .setDescription(`Votre ticket ModMail a été fermé. Merci d'avoir contacté le staff de **${guild.name}**.`)
                        .setColor(modmail.get(`modmail_color_${ticketGuildId}`) || config.bot.couleur)
                        .setFooter({ text: config.bot.footer })
                        .setTimestamp()
                ]
            });
            
            // Informer le staff
            await ticketChannel.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Ticket Fermé")
                        .setDescription(`Le ticket a été fermé par l'utilisateur.`)
                        .setColor(modmail.get(`modmail_color_${ticketGuildId}`) || config.bot.couleur)
                        .setFooter({ text: `Ticket fermé • ${new Date().toLocaleString()}` })
                ]
            });
            
            // Fermer le ticket après 5 secondes
            setTimeout(async () => {
                try {
                    // Supprimer le salon du ticket
                    await ticketChannel.delete(`Ticket ModMail fermé par l'utilisateur`);
                    
                    // Supprimer les entrées de la base de données
                    modmail.delete(`modmail_ticket_${ticketGuildId}_${message.author.id}`);
                    modmail.delete(`modmail_channel_${ticketChannel.id}`);
                } catch (error) {
                    console.error("Erreur lors de la fermeture du ticket ModMail:", error);
                }
            }, 5000);
            
            return;
        }
        
        // Transmettre le message au staff
        let color = modmail.get(`modmail_color_${ticketGuildId}`) || config.bot.couleur;
        
        const userEmbed = new Discord.MessageEmbed()
            .setAuthor({ 
                name: message.author.tag, 
                iconURL: message.author.displayAvatarURL({ dynamic: true }) 
            })
            .setDescription(message.content)
            .setColor(color)
            .setFooter({ text: `ID: ${message.author.id}` })
            .setTimestamp();
        
        // Si le message contient des pièces jointes, les ajouter à l'embed
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            // Vérifier si c'est une image
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                userEmbed.setImage(attachment.url);
            } else {
                userEmbed.addField('Pièce jointe', attachment.url);
            }
        }
        
        // Envoyer l'embed au staff
        await ticketChannel.send({ embeds: [userEmbed] });
        
        // Confirmer à l'utilisateur que son message a été transmis
        await message.react('✅');
    }
}