const Discord = require('discord.js')
const db = require("quick.db")
const config = require('../config')
const modmail = new db.table("Modmail")
const cl = new db.table("Color")

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute(client, interaction) {
        // Vérifier si c'est une interaction de bouton
        if (interaction.isButton()) {
            // Traiter les boutons modmail
            if (interaction.customId === 'close_modmail') {
                await interaction.deferUpdate().catch(() => {});
                
                // Vérifier si le salon est un ticket modmail
                const userId = modmail.get(`modmail_channel_${interaction.channel.id}`);
                if (!userId) {
                    return interaction.followUp({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setDescription("Ce salon n'est pas un ticket ModMail.")
                                .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        ],
                        ephemeral: true
                    });
                }
                
                // Demander une raison de fermeture
                const modal = new Discord.Modal()
                    .setCustomId('close_reason_modal')
                    .setTitle('Fermeture du ticket ModMail');
                
                const reasonInput = new Discord.TextInputComponent()
                    .setCustomId('close_reason')
                    .setLabel("Raison de la fermeture")
                    .setStyle('PARAGRAPH')
                    .setPlaceholder('Entrez une raison pour la fermeture du ticket...')
                    .setRequired(false);
                
                const firstActionRow = new Discord.MessageActionRow().addComponents(reasonInput);
                modal.addComponents(firstActionRow);
                
                await interaction.showModal(modal);
            }
            
            // Traiter les boutons de réponse
            if (interaction.customId === 'reply_modmail') {
                await interaction.deferUpdate().catch(() => {});
                
                // Vérifier si le salon est un ticket modmail
                const userId = modmail.get(`modmail_channel_${interaction.channel.id}`);
                if (!userId) {
                    return interaction.followUp({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setDescription("Ce salon n'est pas un ticket ModMail.")
                                .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        ],
                        ephemeral: true
                    });
                }
                
                // Créer le modal pour la réponse
                const modal = new Discord.Modal()
                    .setCustomId('reply_modal')
                    .setTitle('Répondre à l\'utilisateur');
                
                const messageInput = new Discord.TextInputComponent()
                    .setCustomId('reply_content')
                    .setLabel("Message")
                    .setStyle('PARAGRAPH')
                    .setPlaceholder('Entrez votre message...')
                    .setRequired(true);
                
                const firstActionRow = new Discord.MessageActionRow().addComponents(messageInput);
                modal.addComponents(firstActionRow);
                
                await interaction.showModal(modal);
            }
        }
        
        // Traiter les soumissions de modals
        if (interaction.isModalSubmit()) {
            // Traiter le modal de fermeture de ticket
            if (interaction.customId === 'close_reason_modal') {
                const reason = interaction.fields.getTextInputValue('close_reason') || "Aucune raison spécifiée";
                
                // Récupérer l'ID de l'utilisateur associé à ce salon
                const userId = modmail.get(`modmail_channel_${interaction.channel.id}`);
                if (!userId) {
                    return interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setDescription("Ce salon n'est pas un ticket ModMail.")
                                .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        ],
                        ephemeral: true
                    });
                }
                
                // Récupérer l'utilisateur
                const user = client.users.cache.get(userId);
                
                // Informer l'utilisateur
                if (user) {
                    try {
                        user.send({
                            embeds: [
                                new Discord.MessageEmbed()
                                    .setTitle("Ticket Fermé")
                                    .setDescription(`Votre ticket ModMail a été fermé par un membre du staff.
                                    
**Raison:** ${reason}

Merci d'avoir contacté le staff de **${interaction.guild.name}**. Si vous avez d'autres questions, n'hésitez pas à ouvrir un nouveau ticket.`)
                                    .setColor(modmail.get(`modmail_color_${interaction.guild.id}`) || cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                                    .setFooter({ text: config.bot.footer })
                                    .setTimestamp()
                            ]
                        });
                    } catch (error) {
                        console.error("Erreur lors de l'envoi du message de fermeture à l'utilisateur:", error);
                        interaction.channel.send({
                            embeds: [
                                new Discord.MessageEmbed()
                                    .setDescription("Je n'ai pas pu envoyer de message à l'utilisateur pour l'informer de la fermeture du ticket.")
                                    .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                            ]
                        });
                    }
                }
                
                // Informer le staff
                await interaction.reply({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setTitle("Ticket Fermé")
                            .setDescription(`Le ticket a été fermé par ${interaction.user}.
                            
**Raison:** ${reason}`)
                            .setColor(modmail.get(`modmail_color_${interaction.guild.id}`) || cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                            .setFooter({ text: `Ticket fermé • ${new Date().toLocaleString()}` })
                    ]
                });
                
                // Envoyer dans le salon de logs si configuré
                const logChannelId = modmail.get(`modmail_logs_${interaction.guild.id}`);
                if (logChannelId) {
                    const logChannel = interaction.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const logEmbed = new Discord.MessageEmbed()
                            .setTitle("ModMail - Ticket Fermé")
                            .setDescription(`**Staff:** ${interaction.user.tag} (${interaction.user.id})
**Utilisateur:** ${user ? user.tag : 'Inconnu'} (${userId})
**Raison:** ${reason}`)
                            .setColor(modmail.get(`modmail_color_${interaction.guild.id}`) || cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                            .setTimestamp();
                        
                        logChannel.send({ embeds: [logEmbed] }).catch(console.error);
                    }
                }
                
                // Fermer le ticket après 5 secondes
                setTimeout(async () => {
                    try {
                        // Supprimer le salon du ticket
                        await interaction.channel.delete(`Ticket ModMail fermé par ${interaction.user.tag} - ${reason}`);
                        
                        // Trouver l'entrée du ticket dans la DB
                        const guildIds = client.guilds.cache.map(guild => guild.id);
                        for (const guildId of guildIds) {
                            if (modmail.get(`modmail_ticket_${guildId}_${userId}`)) {
                                modmail.delete(`modmail_ticket_${guildId}_${userId}`);
                                break;
                            }
                        }
                        
                        // Supprimer les entrées de la base de données
                        modmail.delete(`modmail_channel_${interaction.channel.id}`);
                    } catch (error) {
                        console.error("Erreur lors de la fermeture du ticket ModMail:", error);
                    }
                }, 5000);
            }
            
            // Traiter le modal de réponse
            if (interaction.customId === 'reply_modal') {
                const replyContent = interaction.fields.getTextInputValue('reply_content');
                
                // Récupérer l'ID de l'utilisateur associé à ce salon
                const userId = modmail.get(`modmail_channel_${interaction.channel.id}`);
                if (!userId) {
                    return interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setDescription("Ce salon n'est pas un ticket ModMail.")
                                .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        ],
                        ephemeral: true
                    });
                }
                
                // Récupérer l'utilisateur
                const user = client.users.cache.get(userId);
                if (!user) {
                    return interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setDescription("L'utilisateur associé à ce ticket n'a pas été trouvé.")
                                .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        ],
                        ephemeral: true
                    });
                }
                
                // Envoyer le message à l'utilisateur
                try {
                    const userEmbed = new Discord.MessageEmbed()
                        .setAuthor({ 
                            name: `${interaction.user.tag} (Staff)`, 
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                        })
                        .setDescription(replyContent)
                        .setColor(modmail.get(`modmail_color_${interaction.guild.id}`) || cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        .setFooter({ text: `Serveur: ${interaction.guild.name}` })
                        .setTimestamp();
                    
                    await user.send({ embeds: [userEmbed] });
                    
                    // Confirmer l'envoi au staff
                    const confirmEmbed = new Discord.MessageEmbed()
                        .setAuthor({ 
                            name: `${interaction.user.tag} (Staff)`, 
                            iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
                        })
                        .setDescription(replyContent)
                        .setColor(modmail.get(`modmail_color_${interaction.guild.id}`) || cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        .setFooter({ text: `Message envoyé à ${user.tag}` })
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [confirmEmbed] });
                    
                    // Envoyer dans le salon de logs si configuré
                    const logChannelId = modmail.get(`modmail_logs_${interaction.guild.id}`);
                    if (logChannelId) {
                        const logChannel = interaction.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const logEmbed = new Discord.MessageEmbed()
                                .setTitle("ModMail - Réponse Staff")
                                .setDescription(`**Staff:** ${interaction.user.tag} (${interaction.user.id})
**Utilisateur:** ${user.tag} (${user.id})
**Salon:** ${interaction.channel.name} (${interaction.channel.id})
**Message:** ${replyContent}`)
                                .setColor(modmail.get(`modmail_color_${interaction.guild.id}`) || cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                                .setTimestamp();
                            
                            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
                        }
                    }
                    
                } catch (error) {
                    console.error("Erreur lors de l'envoi de la réponse ModMail:", error);
                    
                    // Vérifier si l'erreur est due aux DM fermés
                    if (error.code === 50007) {
                        return interaction.reply({
                            embeds: [
                                new Discord.MessageEmbed()
                                    .setDescription("Je ne peux pas envoyer de message privé à cet utilisateur. Il a peut-être désactivé ses DMs.")
                                    .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                            ],
                            ephemeral: true
                        });
                    }
                    
                    return interaction.reply({
                        embeds: [
                            new Discord.MessageEmbed()
                                .setDescription("Une erreur s'est produite lors de l'envoi du message. Veuillez réessayer plus tard.")
                                .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        ],
                        ephemeral: true
                    });
                }
            }
        }
    }
};