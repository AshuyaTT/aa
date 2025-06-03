const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const automod = new db.table("Automod");

module.exports = {
    name: 'automod',
    usage: 'automod',
    description: `Permet de configurer le système d'automodération.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier les permissions
        if (owner.get(`owners.${message.author.id}`) || config.bot.buyer === message.author.id || message.guild.ownerId === message.author.id) {
            // Récupérer les paramètres actuels
            let antilink = automod.get(`antilink_${message.guild.id}`) || false;
            let antispam = automod.get(`antispam_${message.guild.id}`) || false;
            let antiinsulte = automod.get(`antiinsulte_${message.guild.id}`) || false;
            let antimention = automod.get(`antimention_${message.guild.id}`) || false;
            let logchannel = automod.get(`logchannel_${message.guild.id}`) || null;
            let punishment = automod.get(`punishment_${message.guild.id}`) || "warn";

            // Créer le menu de sélection
            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('automod_menu')
                    .setPlaceholder('Choisissez une option')
                    .addOptions([
                        {
                            label: 'Anti-Liens',
                            description: `${antilink ? 'Désactiver' : 'Activer'} la détection des liens`,
                            value: 'antilink',
                            emoji: '🔗'
                        },
                        {
                            label: 'Anti-Spam',
                            description: `${antispam ? 'Désactiver' : 'Activer'} la détection du spam`,
                            value: 'antispam',
                            emoji: '🔄'
                        },
                        {
                            label: 'Anti-Insultes',
                            description: `${antiinsulte ? 'Désactiver' : 'Activer'} la détection des insultes`,
                            value: 'antiinsulte',
                            emoji: '🤬'
                        },
                        {
                            label: 'Anti-Mentions',
                            description: `${antimention ? 'Désactiver' : 'Activer'} la détection des mentions excessives`,
                            value: 'antimention',
                            emoji: '📢'
                        },
                        {
                            label: 'Salon de logs',
                            description: 'Définir le salon où seront envoyés les logs',
                            value: 'logchannel',
                            emoji: '📝'
                        },
                        {
                            label: 'Sanction',
                            description: 'Définir la sanction pour les infractions',
                            value: 'punishment',
                            emoji: '⚖️'
                        }
                    ])
            );

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle('Configuration de l\'Automodération')
                .setDescription(`Configurez les paramètres d'automodération pour votre serveur.`)
                .addField('Anti-Liens', antilink ? '✅ Activé' : '❌ Désactivé', true)
                .addField('Anti-Spam', antispam ? '✅ Activé' : '❌ Désactivé', true)
                .addField('Anti-Insultes', antiinsulte ? '✅ Activé' : '❌ Désactivé', true)
                .addField('Anti-Mentions', antimention ? '✅ Activé' : '❌ Désactivé', true)
                .addField('Salon de logs', logchannel ? `<#${logchannel}>` : 'Non défini', true)
                .addField('Sanction', punishment === "warn" ? "Avertissement" : punishment === "mute" ? "Mute" : punishment === "kick" ? "Expulsion" : "Bannissement", true)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Envoyer le message
            const msg = await message.channel.send({ embeds: [embed], components: [row] });

            // Créer le collecteur d'interactions
            const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'automod_menu') {
                    const choice = i.values[0];

                    switch (choice) {
                        case 'antilink':
                            antilink = !antilink;
                            automod.set(`antilink_${message.guild.id}`, antilink);
                            break;
                        case 'antispam':
                            antispam = !antispam;
                            automod.set(`antispam_${message.guild.id}`, antispam);
                            break;
                        case 'antiinsulte':
                            antiinsulte = !antiinsulte;
                            automod.set(`antiinsulte_${message.guild.id}`, antiinsulte);
                            break;
                        case 'antimention':
                            antimention = !antimention;
                            automod.set(`antimention_${message.guild.id}`, antimention);
                            break;
                        case 'logchannel':
                            await i.update({ content: 'Veuillez mentionner le salon de logs ou taper "reset" pour réinitialiser.', embeds: [], components: [] });
                            
                            const filter = m => m.author.id === message.author.id;
                            const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
                            
                            collector.on('collect', m => {
                                if (m.content.toLowerCase() === 'reset') {
                                    automod.delete(`logchannel_${message.guild.id}`);
                                    logchannel = null;
                                    message.channel.send('Salon de logs réinitialisé.');
                                } else {
                                    const channel = m.mentions.channels.first();
                                    if (channel) {
                                        automod.set(`logchannel_${message.guild.id}`, channel.id);
                                        logchannel = channel.id;
                                        message.channel.send(`Salon de logs défini sur ${channel}.`);
                                    } else {
                                        message.channel.send('Salon invalide. Aucune modification n\'a été apportée.');
                                    }
                                }
                                
                                // Recréer et envoyer le menu
                                const newEmbed = new Discord.MessageEmbed()
                                    .setTitle('Configuration de l\'Automodération')
                                    .setDescription(`Configurez les paramètres d'automodération pour votre serveur.`)
                                    .addField('Anti-Liens', antilink ? '✅ Activé' : '❌ Désactivé', true)
                                    .addField('Anti-Spam', antispam ? '✅ Activé' : '❌ Désactivé', true)
                                    .addField('Anti-Insultes', antiinsulte ? '✅ Activé' : '❌ Désactivé', true)
                                    .addField('Anti-Mentions', antimention ? '✅ Activé' : '❌ Désactivé', true)
                                    .addField('Salon de logs', logchannel ? `<#${logchannel}>` : 'Non défini', true)
                                    .addField('Sanction', punishment === "warn" ? "Avertissement" : punishment === "mute" ? "Mute" : punishment === "kick" ? "Expulsion" : "Bannissement", true)
                                    .setColor(color)
                                    .setFooter({ text: config.bot.footer });
                                
                                message.channel.send({ embeds: [newEmbed], components: [row] });
                            });
                            
                            return;
                        case 'punishment':
                            const punishmentRow = new Discord.MessageActionRow().addComponents(
                                new Discord.MessageSelectMenu()
                                    .setCustomId('punishment_menu')
                                    .setPlaceholder('Choisissez une sanction')
                                    .addOptions([
                                        {
                                            label: 'Avertissement',
                                            description: 'Donner un avertissement',
                                            value: 'warn',
                                            emoji: '⚠️'
                                        },
                                        {
                                            label: 'Mute',
                                            description: 'Rendre muet temporairement',
                                            value: 'mute',
                                            emoji: '🔇'
                                        },
                                        {
                                            label: 'Expulsion',
                                            description: 'Expulser du serveur',
                                            value: 'kick',
                                            emoji: '👢'
                                        },
                                        {
                                            label: 'Bannissement',
                                            description: 'Bannir du serveur',
                                            value: 'ban',
                                            emoji: '🔨'
                                        }
                                    ])
                            );
                            
                            await i.update({ content: 'Choisissez la sanction à appliquer pour les infractions :', embeds: [], components: [punishmentRow] });
                            
                            const punishmentCollector = message.channel.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 30000 });
                            
                            punishmentCollector.on('collect', async i => {
                                if (i.customId === 'punishment_menu') {
                                    punishment = i.values[0];
                                    automod.set(`punishment_${message.guild.id}`, punishment);
                                    
                                    // Recréer et envoyer le menu
                                    const newEmbed = new Discord.MessageEmbed()
                                        .setTitle('Configuration de l\'Automodération')
                                        .setDescription(`Configurez les paramètres d'automodération pour votre serveur.`)
                                        .addField('Anti-Liens', antilink ? '✅ Activé' : '❌ Désactivé', true)
                                        .addField('Anti-Spam', antispam ? '✅ Activé' : '❌ Désactivé', true)
                                        .addField('Anti-Insultes', antiinsulte ? '✅ Activé' : '❌ Désactivé', true)
                                        .addField('Anti-Mentions', antimention ? '✅ Activé' : '❌ Désactivé', true)
                                        .addField('Salon de logs', logchannel ? `<#${logchannel}>` : 'Non défini', true)
                                        .addField('Sanction', punishment === "warn" ? "Avertissement" : punishment === "mute" ? "Mute" : punishment === "kick" ? "Expulsion" : "Bannissement", true)
                                        .setColor(color)
                                        .setFooter({ text: config.bot.footer });
                                    
                                    await i.update({ content: null, embeds: [newEmbed], components: [row] });
                                    punishmentCollector.stop();
                                }
                            });
                            
                            return;
                    }

                    // Mettre à jour l'embed
                    const newEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration de l\'Automodération')
                        .setDescription(`Configurez les paramètres d'automodération pour votre serveur.`)
                        .addField('Anti-Liens', antilink ? '✅ Activé' : '❌ Désactivé', true)
                        .addField('Anti-Spam', antispam ? '✅ Activé' : '❌ Désactivé', true)
                        .addField('Anti-Insultes', antiinsulte ? '✅ Activé' : '❌ Désactivé', true)
                        .addField('Anti-Mentions', antimention ? '✅ Activé' : '❌ Désactivé', true)
                        .addField('Salon de logs', logchannel ? `<#${logchannel}>` : 'Non défini', true)
                        .addField('Sanction', punishment === "warn" ? "Avertissement" : punishment === "mute" ? "Mute" : punishment === "kick" ? "Expulsion" : "Bannissement", true)
                        .setColor(color)
                        .setFooter({ text: config.bot.footer });

                    await i.update({ embeds: [newEmbed], components: [row] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    msg.edit({ content: 'Temps écoulé. Configuration annulée.', components: [] });
                }
            });
        } else {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
    }
};