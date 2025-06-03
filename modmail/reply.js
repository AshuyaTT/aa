const Discord = require("discord.js")
const db = require('quick.db')
const config = require("../config")
const modmail = new db.table("Modmail")
const cl = new db.table("Color")

module.exports = {
    name: 'reply',
    usage: 'reply <message>',
    description: `Permet de répondre à un utilisateur via le système de modmail.`,
    async execute(client, message, args) {

        let color = cl.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur

        // Vérifier si le salon est un ticket modmail
        const userId = modmail.get(`modmail_channel_${message.channel.id}`);
        if (!userId) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Ce salon n'est pas un ticket ModMail.")
                        .setColor(color)
                ]
            });
        }

        // Vérifier si un message a été fourni
        if (!args[0]) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Veuillez fournir un message à envoyer à l'utilisateur.")
                        .setColor(color)
                ]
            });
        }

        // Récupérer l'utilisateur
        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("L'utilisateur associé à ce ticket n'a pas été trouvé.")
                        .setColor(color)
                ]
            });
        }

        // Construire le message
        const replyContent = args.join(' ');

        // Envoyer le message à l'utilisateur
        try {
            const userEmbed = new Discord.MessageEmbed()
                .setAuthor({ 
                    name: `${message.author.tag} (Staff)`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(replyContent)
                .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                .setFooter({ text: `Serveur: ${message.guild.name}` })
                .setTimestamp();

            // Si le message contient des pièces jointes, ajouter la première à l'embed
            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                // Vérifier si c'est une image
                if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                    userEmbed.setImage(attachment.url);
                } else {
                    userEmbed.addField('Pièce jointe', attachment.url);
                }
            }

            await user.send({ embeds: [userEmbed] });

            // Confirmer l'envoi au staff
            const confirmEmbed = new Discord.MessageEmbed()
                .setAuthor({ 
                    name: `${message.author.tag} (Staff)`, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(replyContent)
                .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                .setFooter({ text: `Message envoyé à ${user.tag}` })
                .setTimestamp();

            // Si le message contenait des pièces jointes, les ajouter à l'embed de confirmation
            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                // Vérifier si c'est une image
                if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                    confirmEmbed.setImage(attachment.url);
                } else {
                    confirmEmbed.addField('Pièce jointe', attachment.url);
                }
            }

            // Envoyer la confirmation au salon du ticket
            await message.channel.send({ embeds: [confirmEmbed] });
            
            // Envoyer dans le salon de logs si configuré
            const logChannelId = modmail.get(`modmail_logs_${message.guild.id}`);
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new Discord.MessageEmbed()
                        .setTitle("ModMail - Réponse Staff")
                        .setDescription(`**Staff:** ${message.author.tag} (${message.author.id})
**Utilisateur:** ${user.tag} (${user.id})
**Salon:** ${message.channel.name} (${message.channel.id})
**Message:** ${replyContent}`)
                        .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                        .setTimestamp();

                    if (message.attachments.size > 0) {
                        const attachment = message.attachments.first();
                        // Vérifier si c'est une image
                        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                            logEmbed.setImage(attachment.url);
                        } else {
                            logEmbed.addField('Pièce jointe', attachment.url);
                        }
                    }

                    logChannel.send({ embeds: [logEmbed] }).catch(console.error);
                }
            }

            // Supprimer le message original pour éviter l'encombrement
            if (message.deletable) {
                message.delete().catch(() => {});
            }

        } catch (error) {
            console.error("Erreur lors de l'envoi de la réponse ModMail:", error);
            
            // Vérifier si l'erreur est due aux DM fermés
            if (error.code === 50007) {
                return message.reply({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setDescription("Je ne peux pas envoyer de message privé à cet utilisateur. Il a peut-être désactivé ses DMs.")
                            .setColor(color)
                    ]
                });
            }
            
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Une erreur s'est produite lors de l'envoi du message. Veuillez réessayer plus tard.")
                        .setColor(color)
                ]
            });
        }
    }
};