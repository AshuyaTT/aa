const Discord = require("discord.js")
const db = require('quick.db')
const owner = new db.table("Owner")
const modmail = new db.table("Modmail")
const config = require("../config")
const cl = new db.table("Color")

module.exports = {
    name: 'modmailconfig',
    usage: 'modmailconfig',
    description: `Permet de configurer le système de modmail.`,
    async execute(client, message, args) {

        if (owner.get(`owners.${message.author.id}`) || config.bot.buyer.includes(message.author.id)) {

            let color = cl.fetch(`color_${message.guild.id}`)
            if (color == null) color = config.bot.couleur

            const embed = new Discord.MessageEmbed()
                .setTitle("Configuration du ModMail")
                .setDescription(`Configurez le système de ModMail pour permettre aux utilisateurs de contacter le staff via des messages privés au bot.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer })

            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('modmailconfig')
                    .setPlaceholder('Sélectionnez une option')
                    .addOptions([
                        {
                            label: 'Activer/Désactiver',
                            description: 'Activer ou désactiver le système de modmail',
                            value: 'toggle',
                            emoji: '🔄'
                        },
                        {
                            label: 'Salon de Logs',
                            description: 'Définir le salon où les tickets modmail seront créés',
                            value: 'logchannel',
                            emoji: '📝'
                        },
                        {
                            label: 'Catégorie',
                            description: 'Définir la catégorie où les tickets modmail seront créés',
                            value: 'category',
                            emoji: '📁'
                        },
                        {
                            label: 'Rôle Staff',
                            description: 'Définir le rôle qui aura accès aux tickets modmail',
                            value: 'staffrole',
                            emoji: '👮'
                        },
                        {
                            label: 'Message d\'Accueil',
                            description: 'Définir le message d\'accueil envoyé aux utilisateurs',
                            value: 'welcome',
                            emoji: '👋'
                        },
                        {
                            label: 'Couleur des Embeds',
                            description: 'Définir la couleur des embeds modmail',
                            value: 'color',
                            emoji: '🎨'
                        },
                        {
                            label: 'Statut Actuel',
                            description: 'Voir la configuration actuelle du modmail',
                            value: 'status',
                            emoji: '📊'
                        }
                    ])
            );

            const msg = await message.channel.send({ embeds: [embed], components: [row] });

            const collector = message.channel.createMessageComponentCollector({
                componentType: "SELECT_MENU",
                filter: (i => i.user.id === message.author.id),
                time: 300000
            });

            collector.on("collect", async (collected) => {
                collected.deferUpdate();
                const value = collected.values[0];

                if (value === "toggle") {
                    const status = modmail.get(`modmail_enabled_${message.guild.id}`) || false;
                    modmail.set(`modmail_enabled_${message.guild.id}`, !status);

                    const toggleEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration du ModMail")
                        .setDescription(`Le système de ModMail a été ${!status ? "activé" : "désactivé"} sur ce serveur.`)
                        .setColor(color)
                        .setFooter({ text: config.bot.footer });

                    msg.edit({ embeds: [toggleEmbed], components: [row] });

                } else if (value === "logchannel") {
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration du ModMail")
                        .setDescription(`Veuillez mentionner ou entrer l'ID du salon où les logs de modmail seront envoyées.`)
                        .setColor(color)
                        .setFooter({ text: "Tapez 'annuler' pour annuler" });

                    await msg.edit({ embeds: [promptEmbed], components: [] });

                    const filter = m => m.author.id === message.author.id;
                    const channelCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

                    channelCollector.on('collect', async m => {
                        if (m.content.toLowerCase() === 'annuler') {
                            const cancelEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [cancelEmbed], components: [row] });
                            return;
                        }

                        let channel = m.mentions.channels.first() || message.guild.channels.cache.get(m.content);
                        if (!channel) {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Salon invalide. Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [errorEmbed], components: [row] });
                            return;
                        }

                        modmail.set(`modmail_logs_${message.guild.id}`, channel.id);

                        const successEmbed = new Discord.MessageEmbed()
                            .setTitle("Configuration du ModMail")
                            .setDescription(`Le salon de logs de modmail a été défini sur ${channel}.`)
                            .setColor(color)
                            .setFooter({ text: config.bot.footer });

                        msg.edit({ embeds: [successEmbed], components: [row] });
                    });

                } else if (value === "category") {
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration du ModMail")
                        .setDescription(`Veuillez entrer l'ID de la catégorie où les tickets modmail seront créés.`)
                        .setColor(color)
                        .setFooter({ text: "Tapez 'annuler' pour annuler" });

                    await msg.edit({ embeds: [promptEmbed], components: [] });

                    const filter = m => m.author.id === message.author.id;
                    const categoryCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

                    categoryCollector.on('collect', async m => {
                        if (m.content.toLowerCase() === 'annuler') {
                            const cancelEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [cancelEmbed], components: [row] });
                            return;
                        }

                        let category = message.guild.channels.cache.get(m.content);
                        if (!category || category.type !== 'GUILD_CATEGORY') {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Catégorie invalide. Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [errorEmbed], components: [row] });
                            return;
                        }

                        modmail.set(`modmail_category_${message.guild.id}`, category.id);

                        const successEmbed = new Discord.MessageEmbed()
                            .setTitle("Configuration du ModMail")
                            .setDescription(`La catégorie pour les tickets modmail a été définie sur **${category.name}**.`)
                            .setColor(color)
                            .setFooter({ text: config.bot.footer });

                        msg.edit({ embeds: [successEmbed], components: [row] });
                    });

                } else if (value === "staffrole") {
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration du ModMail")
                        .setDescription(`Veuillez mentionner ou entrer l'ID du rôle qui aura accès aux tickets modmail.`)
                        .setColor(color)
                        .setFooter({ text: "Tapez 'annuler' pour annuler" });

                    await msg.edit({ embeds: [promptEmbed], components: [] });

                    const filter = m => m.author.id === message.author.id;
                    const roleCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

                    roleCollector.on('collect', async m => {
                        if (m.content.toLowerCase() === 'annuler') {
                            const cancelEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [cancelEmbed], components: [row] });
                            return;
                        }

                        let role = m.mentions.roles.first() || message.guild.roles.cache.get(m.content);
                        if (!role) {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Rôle invalide. Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [errorEmbed], components: [row] });
                            return;
                        }

                        modmail.set(`modmail_staffrole_${message.guild.id}`, role.id);

                        const successEmbed = new Discord.MessageEmbed()
                            .setTitle("Configuration du ModMail")
                            .setDescription(`Le rôle staff pour le modmail a été défini sur ${role}.`)
                            .setColor(color)
                            .setFooter({ text: config.bot.footer });

                        msg.edit({ embeds: [successEmbed], components: [row] });
                    });

                } else if (value === "welcome") {
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration du ModMail")
                        .setDescription(`Veuillez entrer le message d'accueil qui sera envoyé aux utilisateurs lorsqu'ils ouvrent un ticket modmail.
                        
Variables disponibles:
\`{user}\` - Nom de l'utilisateur
\`{usertag}\` - Tag complet de l'utilisateur (nom#discriminant)
\`{userid}\` - ID de l'utilisateur
\`{server}\` - Nom du serveur
\`{serverid}\` - ID du serveur`)
                        .setColor(color)
                        .setFooter({ text: "Tapez 'annuler' pour annuler" });

                    await msg.edit({ embeds: [promptEmbed], components: [] });

                    const filter = m => m.author.id === message.author.id;
                    const welcomeCollector = message.channel.createMessageCollector({ filter, time: 300000, max: 1 });

                    welcomeCollector.on('collect', async m => {
                        if (m.content.toLowerCase() === 'annuler') {
                            const cancelEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [cancelEmbed], components: [row] });
                            return;
                        }

                        modmail.set(`modmail_welcome_${message.guild.id}`, m.content);

                        const successEmbed = new Discord.MessageEmbed()
                            .setTitle("Configuration du ModMail")
                            .setDescription(`Le message d'accueil a été défini avec succès.`)
                            .setColor(color)
                            .setFooter({ text: config.bot.footer });

                        msg.edit({ embeds: [successEmbed], components: [row] });
                    });

                } else if (value === "color") {
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration du ModMail")
                        .setDescription(`Veuillez entrer le code couleur hexadécimal pour les embeds modmail (ex: #FF0000 pour rouge).`)
                        .setColor(color)
                        .setFooter({ text: "Tapez 'annuler' pour annuler" });

                    await msg.edit({ embeds: [promptEmbed], components: [] });

                    const filter = m => m.author.id === message.author.id;
                    const colorCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });

                    colorCollector.on('collect', async m => {
                        if (m.content.toLowerCase() === 'annuler') {
                            const cancelEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Configuration annulée.`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [cancelEmbed], components: [row] });
                            return;
                        }

                        // Vérification du format hexadécimal
                        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                        if (!hexColorRegex.test(m.content)) {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle("Configuration du ModMail")
                                .setDescription(`Format de couleur invalide. Veuillez utiliser un format hexadécimal valide (ex: #FF0000).`)
                                .setColor(color)
                                .setFooter({ text: config.bot.footer });

                            msg.edit({ embeds: [errorEmbed], components: [row] });
                            return;
                        }

                        modmail.set(`modmail_color_${message.guild.id}`, m.content);

                        const successEmbed = new Discord.MessageEmbed()
                            .setTitle("Configuration du ModMail")
                            .setDescription(`La couleur des embeds modmail a été définie sur \`${m.content}\`.`)
                            .setColor(m.content)
                            .setFooter({ text: config.bot.footer });

                        msg.edit({ embeds: [successEmbed], components: [row] });
                    });

                } else if (value === "status") {
                    const enabled = modmail.get(`modmail_enabled_${message.guild.id}`) ? "✅ Activé" : "❌ Désactivé";
                    const logChannelId = modmail.get(`modmail_logs_${message.guild.id}`);
                    const logChannel = logChannelId ? `<#${logChannelId}>` : "Non défini";
                    
                    const categoryId = modmail.get(`modmail_category_${message.guild.id}`);
                    const category = categoryId ? message.guild.channels.cache.get(categoryId)?.name || "Catégorie introuvable" : "Non défini";
                    
                    const staffRoleId = modmail.get(`modmail_staffrole_${message.guild.id}`);
                    const staffRole = staffRoleId ? `<@&${staffRoleId}>` : "Non défini";
                    
                    const welcomeMsg = modmail.get(`modmail_welcome_${message.guild.id}`) || "Message par défaut";
                    const embedColor = modmail.get(`modmail_color_${message.guild.id}`) || color;

                    const statusEmbed = new Discord.MessageEmbed()
                        .setTitle("Configuration Actuelle du ModMail")
                        .addFields(
                            { name: "Statut", value: enabled, inline: true },
                            { name: "Salon de Logs", value: logChannel, inline: true },
                            { name: "Catégorie", value: category, inline: true },
                            { name: "Rôle Staff", value: staffRole, inline: true },
                            { name: "Couleur des Embeds", value: embedColor, inline: true },
                            { name: "Message d'Accueil", value: welcomeMsg.length > 1024 ? welcomeMsg.substring(0, 1021) + "..." : welcomeMsg }
                        )
                        .setColor(embedColor)
                        .setFooter({ text: config.bot.footer });

                    msg.edit({ embeds: [statusEmbed], components: [row] });
                }
            });
        }
    }
};