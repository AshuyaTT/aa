const Discord = require("discord.js")
const db = require('quick.db')
const config = require("../config")
const modmail = new db.table("Modmail")
const cl = new db.table("Color")

module.exports = {
    name: 'modmail',
    usage: 'modmail',
    description: `Permet de créer un ticket modmail pour contacter le staff.`,
    async execute(client, message, args) {

        let color = cl.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur

        // Vérifier si le modmail est activé sur ce serveur
        const isEnabled = modmail.get(`modmail_enabled_${message.guild.id}`);
        if (!isEnabled) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Le système de ModMail n'est pas activé sur ce serveur.")
                        .setColor(color)
                ]
            });
        }

        // Vérifier si l'utilisateur a déjà un ticket ouvert
        const existingTicket = modmail.get(`modmail_ticket_${message.guild.id}_${message.author.id}`);
        if (existingTicket) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription(`Vous avez déjà un ticket ModMail ouvert. Envoyez un message direct au bot pour continuer votre conversation.`)
                        .setColor(color)
                ]
            });
        }

        try {
            // Envoyer un message privé à l'utilisateur
            const userEmbed = new Discord.MessageEmbed()
                .setTitle("ModMail - Nouveau Ticket")
                .setDescription(`Vous venez d'ouvrir un ticket ModMail avec le serveur **${message.guild.name}**.
                
Tout message que vous enverrez dans cette conversation sera transmis au staff du serveur. Ils vous répondront dès que possible.

Pour fermer ce ticket, envoyez \`close\` dans cette conversation.`)
                .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                .setFooter({ text: `ID du serveur: ${message.guild.id}` })
                .setTimestamp();

            await message.author.send({ embeds: [userEmbed] });

            // Créer un salon de ticket dans le serveur
            const staffRole = modmail.get(`modmail_staffrole_${message.guild.id}`);
            const category = modmail.get(`modmail_category_${message.guild.id}`);

            if (!category) {
                return message.reply({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setDescription("La catégorie pour les tickets ModMail n'a pas été configurée. Veuillez contacter un administrateur.")
                            .setColor(color)
                    ]
                });
            }

            // Créer le salon du ticket
            const ticketChannel = await message.guild.channels.create(`modmail-${message.author.username}`, {
                type: 'GUILD_TEXT',
                parent: category,
                permissionOverwrites: [
                    {
                        id: message.guild.id,
                        deny: ['VIEW_CHANNEL']
                    },
                    {
                        id: client.user.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY']
                    }
                ]
            });

            // Ajouter les permissions pour le rôle staff
            if (staffRole) {
                await ticketChannel.permissionOverwrites.create(staffRole, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                    READ_MESSAGE_HISTORY: true,
                    ATTACH_FILES: true,
                    EMBED_LINKS: true
                });
            }

            // Enregistrer les informations du ticket
            modmail.set(`modmail_ticket_${message.guild.id}_${message.author.id}`, {
                channelId: ticketChannel.id,
                userId: message.author.id,
                guildId: message.guild.id,
                createdAt: Date.now()
            });

            modmail.set(`modmail_channel_${ticketChannel.id}`, message.author.id);

            // Envoyer le message d'ouverture dans le salon du ticket
            const ticketEmbed = new Discord.MessageEmbed()
                .setTitle(`Nouveau Ticket ModMail`)
                .setDescription(`Ticket ouvert par ${message.author} (${message.author.tag} - ${message.author.id})
                
Utilisez ce canal pour communiquer avec l'utilisateur. Tous les messages envoyés ici seront transmis à l'utilisateur.

Pour fermer ce ticket, tapez \`close\` dans ce canal.`)
                .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Ticket ouvert • ${new Date().toLocaleString()}` });

            const row = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setCustomId('close_modmail')
                        .setLabel('Fermer le ticket')
                        .setStyle('DANGER')
                        .setEmoji('🔒')
                );

            await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });

            // Confirmation à l'utilisateur
            const confirmEmbed = new Discord.MessageEmbed()
                .setDescription(`✅ Votre ticket ModMail a été créé avec succès. Veuillez vérifier vos messages privés pour continuer la conversation.`)
                .setColor(color);

            return message.reply({ embeds: [confirmEmbed] });

        } catch (error) {
            console.error("Erreur lors de la création du ticket ModMail:", error);
            
            // Vérifier si l'erreur est due aux DM fermés
            if (error.code === 50007) {
                return message.reply({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setDescription("Je ne peux pas vous envoyer de message privé. Veuillez activer les messages privés pour ce serveur et réessayer.")
                            .setColor(color)
                    ]
                });
            }
            
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Une erreur s'est produite lors de la création du ticket ModMail. Veuillez réessayer plus tard.")
                        .setColor(color)
                ]
            });
        }
    }
};