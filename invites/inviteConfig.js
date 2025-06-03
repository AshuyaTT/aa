const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");

module.exports = {
    name: 'inviteconfig',
    aliases: ['invitesettings', 'inviteset'],
    description: 'Configure le système d\'invitation',
    run: async (client, message, args) => {
        // Vérifier les permissions
        if (!message.member.permissions.has('ADMINISTRATOR') && !config.buyer.includes(message.author.id) && message.guild.ownerId !== message.author.id) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Vous n'avez pas la permission d'utiliser cette commande.`)
                ]
            });
        }

        // Créer le menu de sélection
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('inviteconfig')
                    .setPlaceholder('Sélectionnez une option')
                    .addOptions([
                        {
                            label: 'Activer/Désactiver',
                            description: 'Active ou désactive le système d\'invitation',
                            value: 'toggle',
                            emoji: '⚙️'
                        },
                        {
                            label: 'Salon d\'annonce',
                            description: 'Définit le salon où seront envoyés les messages d\'accueil',
                            value: 'channel',
                            emoji: '📢'
                        },
                        {
                            label: 'Message d\'accueil',
                            description: 'Personnalise le message d\'accueil',
                            value: 'message',
                            emoji: '💬'
                        },
                        {
                            label: 'Réinitialiser',
                            description: 'Réinitialise toutes les données d\'invitation',
                            value: 'reset',
                            emoji: '🔄'
                        }
                    ])
            );

        // Récupérer les paramètres actuels
        const inviteEnabled = db.get(`inviteEnabled_${message.guild.id}`);
        const inviteChannel = db.get(`inviteChannel_${message.guild.id}`);
        const inviteMessage = db.get(`inviteMessage_${message.guild.id}`);

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setTitle('Configuration du système d\'invitation')
            .setDescription('Utilisez le menu ci-dessous pour configurer le système d\'invitation.')
            .addField('⚙️ Statut', inviteEnabled === false ? 'Désactivé' : 'Activé', true)
            .addField('📢 Salon d\'annonce', inviteChannel ? `<#${inviteChannel}>` : 'Non défini', true)
            .addField('💬 Message d\'accueil', inviteMessage || 'Message par défaut')
            .setFooter({ text: `${config.footer}` })
            .setTimestamp();

        // Envoyer le message
        const msg = await message.reply({ embeds: [embed], components: [row] });

        // Créer le collecteur
        const collector = msg.createMessageComponentCollector({ 
            filter: i => i.user.id === message.author.id,
            time: 60000 // 1 minute
        });

        // Gérer les interactions
        collector.on('collect', async interaction => {
            // Récupérer l'option sélectionnée
            const option = interaction.values[0];

            // Traiter l'option
            switch (option) {
                case 'toggle':
                    // Inverser l'état
                    const newState = inviteEnabled === false ? true : false;
                    db.set(`inviteEnabled_${message.guild.id}`, newState);
                    
                    // Mettre à jour l'embed
                    embed.fields[0].value = newState ? 'Activé' : 'Désactivé';
                    
                    // Répondre à l'interaction
                    await interaction.update({ embeds: [embed], components: [row] });
                    break;
                    
                case 'channel':
                    // Demander le salon
                    await interaction.update({ 
                        embeds: [
                            new Discord.MessageEmbed()
                                .setColor(config.color)
                                .setDescription('Mentionnez le salon où seront envoyés les messages d\'accueil.')
                        ], 
                        components: [] 
                    });
                    
                    // Collecter la réponse
                    const channelFilter = m => m.author.id === message.author.id;
                    const channelCollector = message.channel.createMessageCollector({ filter: channelFilter, time: 30000, max: 1 });
                    
                    channelCollector.on('collect', async m => {
                        // Récupérer le salon
                        const channel = m.mentions.channels.first() || message.guild.channels.cache.get(m.content);
                        
                        if (!channel) {
                            // Salon invalide
                            await msg.edit({ 
                                embeds: [
                                    new Discord.MessageEmbed()
                                        .setColor(config.color)
                                        .setDescription('❌ Salon invalide. Veuillez réessayer.')
                                ], 
                                components: [row] 
                            });
                        } else {
                            // Enregistrer le salon
                            db.set(`inviteChannel_${message.guild.id}`, channel.id);
                            
                            // Mettre à jour l'embed
                            embed.fields[1].value = `<#${channel.id}>`;
                            
                            // Mettre à jour le message
                            await msg.edit({ embeds: [embed], components: [row] });
                        }
                    });
                    
                    channelCollector.on('end', collected => {
                        if (collected.size === 0) {
                            // Aucune réponse
                            msg.edit({ 
                                embeds: [embed], 
                                components: [row] 
                            });
                        }
                    });
                    break;
                    
                case 'message':
                    // Demander le message
                    await interaction.update({ 
                        embeds: [
                            new Discord.MessageEmbed()
                                .setColor(config.color)
                                .setDescription('Entrez le message d\'accueil. Vous pouvez utiliser les variables suivantes :\n`{user}` - Mention de l\'utilisateur\n`{username}` - Nom de l\'utilisateur\n`{server}` - Nom du serveur\n`{inviter}` - Mention de l\'inviteur\n`{invitername}` - Nom de l\'inviteur\n`{invites}` - Nombre d\'invitations de l\'inviteur')
                        ], 
                        components: [] 
                    });
                    
                    // Collecter la réponse
                    const messageFilter = m => m.author.id === message.author.id;
                    const messageCollector = message.channel.createMessageCollector({ filter: messageFilter, time: 60000, max: 1 });
                    
                    messageCollector.on('collect', async m => {
                        // Enregistrer le message
                        db.set(`inviteMessage_${message.guild.id}`, m.content);
                        
                        // Mettre à jour l'embed
                        embed.fields[2].value = m.content.length > 1024 ? m.content.substring(0, 1021) + '...' : m.content;
                        
                        // Mettre à jour le message
                        await msg.edit({ embeds: [embed], components: [row] });
                    });
                    
                    messageCollector.on('end', collected => {
                        if (collected.size === 0) {
                            // Aucune réponse
                            msg.edit({ 
                                embeds: [embed], 
                                components: [row] 
                            });
                        }
                    });
                    break;
                    
                case 'reset':
                    // Demander confirmation
                    await interaction.update({ 
                        embeds: [
                            new Discord.MessageEmbed()
                                .setColor(config.color)
                                .setDescription('⚠️ Êtes-vous sûr de vouloir réinitialiser toutes les données d\'invitation ? Cette action est irréversible.')
                        ], 
                        components: [
                            new Discord.MessageActionRow()
                                .addComponents(
                                    new Discord.MessageButton()
                                        .setCustomId('confirm')
                                        .setLabel('Confirmer')
                                        .setStyle('DANGER'),
                                    new Discord.MessageButton()
                                        .setCustomId('cancel')
                                        .setLabel('Annuler')
                                        .setStyle('SECONDARY')
                                )
                        ] 
                    });
                    
                    // Collecter la réponse
                    const confirmFilter = i => i.user.id === message.author.id;
                    const confirmCollector = msg.createMessageComponentCollector({ filter: confirmFilter, time: 30000, max: 1 });
                    
                    confirmCollector.on('collect', async i => {
                        if (i.customId === 'confirm') {
                            // Réinitialiser les données
                            const invites = new db.table("Invites");
                            const keys = invites.all().filter(data => data.ID.startsWith(`invite`) && data.ID.includes(`_${message.guild.id}_`));
                            
                            for (const key of keys) {
                                invites.delete(key.ID);
                            }
                            
                            // Réinitialiser les paramètres
                            db.delete(`inviteEnabled_${message.guild.id}`);
                            db.delete(`inviteChannel_${message.guild.id}`);
                            db.delete(`inviteMessage_${message.guild.id}`);
                            
                            // Mettre à jour l'embed
                            embed.fields[0].value = 'Activé';
                            embed.fields[1].value = 'Non défini';
                            embed.fields[2].value = 'Message par défaut';
                            
                            // Répondre à l'interaction
                            await i.update({ 
                                embeds: [
                                    new Discord.MessageEmbed()
                                        .setColor(config.color)
                                        .setDescription('✅ Toutes les données d\'invitation ont été réinitialisées.')
                                ], 
                                components: [] 
                            });
                        } else {
                            // Annuler
                            await i.update({ embeds: [embed], components: [row] });
                        }
                    });
                    
                    confirmCollector.on('end', collected => {
                        if (collected.size === 0) {
                            // Aucune réponse
                            msg.edit({ 
                                embeds: [embed], 
                                components: [row] 
                            });
                        }
                    });
                    break;
            }
        });

        // Fin du collecteur
        collector.on('end', collected => {
            if (collected.size === 0) {
                // Aucune interaction
                msg.edit({ 
                    embeds: [embed], 
                    components: [] 
                });
            }
        });
    }
};