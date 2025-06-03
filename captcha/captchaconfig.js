const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const captcha = new db.table("Captcha");
const footer = config.bot.footer;

module.exports = {
    name: 'captchaconfig',
    usage: 'captchaconfig',
    description: `Permet de configurer le système de captcha.`,
    async execute(client, message, args) {

        if (owner.get(`owners.${message.author.id}`) || config.bot.buyer === message.author.id || message.guild.ownerId === message.author.id) {

            let color = cl.fetch(`color_${message.guild.id}`);
            if (color == null) color = config.bot.couleur;

            // Récupérer les paramètres actuels
            let captchaEnabled = captcha.get(`captcha_enabled_${message.guild.id}`);
            if (captchaEnabled === null) captchaEnabled = false;

            let verificationChannel = captcha.get(`captcha_channel_${message.guild.id}`);
            let verifiedRole = captcha.get(`captcha_role_${message.guild.id}`);
            let captchaDifficulty = captcha.get(`captcha_difficulty_${message.guild.id}`);
            if (captchaDifficulty === null) captchaDifficulty = "medium";

            let captchaTimeout = captcha.get(`captcha_timeout_${message.guild.id}`);
            if (captchaTimeout === null) captchaTimeout = 120; // 2 minutes par défaut

            // Créer le menu de sélection
            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('captchaconfig')
                    .setPlaceholder('Choisissez une option à configurer')
                    .addOptions([
                        {
                            label: `${captchaEnabled ? 'Désactiver' : 'Activer'} le captcha`,
                            description: `Le captcha est actuellement ${captchaEnabled ? 'activé' : 'désactivé'}`,
                            value: 'toggle',
                            emoji: '🔄'
                        },
                        {
                            label: 'Définir le salon de vérification',
                            description: 'Salon où les captchas seront envoyés',
                            value: 'channel',
                            emoji: '📝'
                        },
                        {
                            label: 'Définir le rôle vérifié',
                            description: 'Rôle attribué après vérification',
                            value: 'role',
                            emoji: '🏷️'
                        },
                        {
                            label: 'Définir la difficulté',
                            description: `Difficulté actuelle: ${captchaDifficulty}`,
                            value: 'difficulty',
                            emoji: '🔒'
                        },
                        {
                            label: 'Définir le délai d\'expiration',
                            description: `Délai actuel: ${captchaTimeout} secondes`,
                            value: 'timeout',
                            emoji: '⏱️'
                        },
                        {
                            label: 'Tester le captcha',
                            description: 'Envoyer un captcha de test',
                            value: 'test',
                            emoji: '🧪'
                        }
                    ])
            );

            // Créer l'embed d'information
            const embed = new Discord.MessageEmbed()
                .setTitle('Configuration du Captcha')
                .setDescription(`
Configurez le système de captcha pour protéger votre serveur contre les raids de bots.

**État actuel:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${verificationChannel ? `<#${verificationChannel}>` : 'Non défini'}
**Rôle vérifié:** ${verifiedRole ? `<@&${verifiedRole}>` : 'Non défini'}
**Difficulté:** ${captchaDifficulty}
**Délai d'expiration:** ${captchaTimeout} secondes

*Sélectionnez une option dans le menu ci-dessous pour configurer le système de captcha.*
                `)
                .setColor(color)
                .setFooter({ text: footer });

            const msg = await message.channel.send({ embeds: [embed], components: [row] });

            // Créer le collecteur pour le menu
            const collector = message.channel.createMessageComponentCollector({
                componentType: 'SELECT_MENU',
                filter: i => i.user.id === message.author.id && i.customId === 'captchaconfig',
                time: 60000
            });

            collector.on('collect', async (interaction) => {
                interaction.deferUpdate();
                const value = interaction.values[0];

                if (value === 'toggle') {
                    // Activer/désactiver le captcha
                    captchaEnabled = !captchaEnabled;
                    captcha.set(`captcha_enabled_${message.guild.id}`, captchaEnabled);

                    const newEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration du Captcha')
                        .setDescription(`
Le système de captcha a été ${captchaEnabled ? 'activé' : 'désactivé'} avec succès.

**État actuel:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${verificationChannel ? `<#${verificationChannel}>` : 'Non défini'}
**Rôle vérifié:** ${verifiedRole ? `<@&${verifiedRole}>` : 'Non défini'}
**Difficulté:** ${captchaDifficulty}
**Délai d'expiration:** ${captchaTimeout} secondes

*Sélectionnez une option dans le menu ci-dessous pour configurer le système de captcha.*
                        `)
                        .setColor(color)
                        .setFooter({ text: footer });

                    // Mettre à jour le menu
                    const newRow = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageSelectMenu()
                            .setCustomId('captchaconfig')
                            .setPlaceholder('Choisissez une option à configurer')
                            .addOptions([
                                {
                                    label: `${captchaEnabled ? 'Désactiver' : 'Activer'} le captcha`,
                                    description: `Le captcha est actuellement ${captchaEnabled ? 'activé' : 'désactivé'}`,
                                    value: 'toggle',
                                    emoji: '🔄'
                                },
                                {
                                    label: 'Définir le salon de vérification',
                                    description: 'Salon où les captchas seront envoyés',
                                    value: 'channel',
                                    emoji: '📝'
                                },
                                {
                                    label: 'Définir le rôle vérifié',
                                    description: 'Rôle attribué après vérification',
                                    value: 'role',
                                    emoji: '🏷️'
                                },
                                {
                                    label: 'Définir la difficulté',
                                    description: `Difficulté actuelle: ${captchaDifficulty}`,
                                    value: 'difficulty',
                                    emoji: '🔒'
                                },
                                {
                                    label: 'Définir le délai d\'expiration',
                                    description: `Délai actuel: ${captchaTimeout} secondes`,
                                    value: 'timeout',
                                    emoji: '⏱️'
                                },
                                {
                                    label: 'Tester le captcha',
                                    description: 'Envoyer un captcha de test',
                                    value: 'test',
                                    emoji: '🧪'
                                }
                            ])
                    );

                    await msg.edit({ embeds: [newEmbed], components: [newRow] });
                } else if (value === 'channel') {
                    // Demander le salon de vérification
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration du Captcha')
                        .setDescription(`Mentionnez le salon où les captchas seront envoyés.`)
                        .setColor(color)
                        .setFooter({ text: footer });

                    const promptMsg = await message.channel.send({ embeds: [promptEmbed] });

                    const filter = m => m.author.id === message.author.id;
                    const channelCollector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

                    channelCollector.on('collect', async (m) => {
                        const channel = m.mentions.channels.first() || message.guild.channels.cache.get(m.content);

                        if (channel && channel.type === 'GUILD_TEXT') {
                            verificationChannel = channel.id;
                            captcha.set(`captcha_channel_${message.guild.id}`, channel.id);

                            const successEmbed = new Discord.MessageEmbed()
                                .setTitle('Configuration du Captcha')
                                .setDescription(`
Le salon de vérification a été défini sur ${channel}.

**État actuel:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${channel}
**Rôle vérifié:** ${verifiedRole ? `<@&${verifiedRole}>` : 'Non défini'}
**Difficulté:** ${captchaDifficulty}
**Délai d'expiration:** ${captchaTimeout} secondes

*Sélectionnez une option dans le menu ci-dessous pour configurer le système de captcha.*
                                `)
                                .setColor(color)
                                .setFooter({ text: footer });

                            await msg.edit({ embeds: [successEmbed] });
                        } else {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle('Configuration du Captcha')
                                .setDescription(`Salon invalide. Veuillez mentionner un salon textuel valide.`)
                                .setColor('RED')
                                .setFooter({ text: footer });

                            await message.channel.send({ embeds: [errorEmbed] });
                        }

                        promptMsg.delete().catch(() => {});
                        m.delete().catch(() => {});
                    });

                    channelCollector.on('end', (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            promptMsg.delete().catch(() => {});
                        }
                    });
                } else if (value === 'role') {
                    // Demander le rôle vérifié
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration du Captcha')
                        .setDescription(`Mentionnez le rôle qui sera attribué aux membres après vérification.`)
                        .setColor(color)
                        .setFooter({ text: footer });

                    const promptMsg = await message.channel.send({ embeds: [promptEmbed] });

                    const filter = m => m.author.id === message.author.id;
                    const roleCollector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

                    roleCollector.on('collect', async (m) => {
                        const role = m.mentions.roles.first() || message.guild.roles.cache.get(m.content);

                        if (role) {
                            verifiedRole = role.id;
                            captcha.set(`captcha_role_${message.guild.id}`, role.id);

                            const successEmbed = new Discord.MessageEmbed()
                                .setTitle('Configuration du Captcha')
                                .setDescription(`
Le rôle vérifié a été défini sur ${role}.

**État actuel:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${verificationChannel ? `<#${verificationChannel}>` : 'Non défini'}
**Rôle vérifié:** ${role}
**Difficulté:** ${captchaDifficulty}
**Délai d'expiration:** ${captchaTimeout} secondes

*Sélectionnez une option dans le menu ci-dessous pour configurer le système de captcha.*
                                `)
                                .setColor(color)
                                .setFooter({ text: footer });

                            await msg.edit({ embeds: [successEmbed] });
                        } else {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle('Configuration du Captcha')
                                .setDescription(`Rôle invalide. Veuillez mentionner un rôle valide.`)
                                .setColor('RED')
                                .setFooter({ text: footer });

                            await message.channel.send({ embeds: [errorEmbed] });
                        }

                        promptMsg.delete().catch(() => {});
                        m.delete().catch(() => {});
                    });

                    roleCollector.on('end', (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            promptMsg.delete().catch(() => {});
                        }
                    });
                } else if (value === 'difficulty') {
                    // Créer un menu pour choisir la difficulté
                    const difficultyRow = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageSelectMenu()
                            .setCustomId('captchadifficulty')
                            .setPlaceholder('Choisissez une difficulté')
                            .addOptions([
                                {
                                    label: 'Facile',
                                    description: 'Captcha de 4 caractères',
                                    value: 'easy',
                                    emoji: '🟢'
                                },
                                {
                                    label: 'Moyen',
                                    description: 'Captcha de 6 caractères',
                                    value: 'medium',
                                    emoji: '🟡'
                                },
                                {
                                    label: 'Difficile',
                                    description: 'Captcha de 8 caractères',
                                    value: 'hard',
                                    emoji: '🔴'
                                }
                            ])
                    );

                    const difficultyEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration du Captcha')
                        .setDescription(`Choisissez la difficulté du captcha.`)
                        .setColor(color)
                        .setFooter({ text: footer });

                    const difficultyMsg = await message.channel.send({ embeds: [difficultyEmbed], components: [difficultyRow] });

                    const difficultyCollector = message.channel.createMessageComponentCollector({
                        componentType: 'SELECT_MENU',
                        filter: i => i.user.id === message.author.id && i.customId === 'captchadifficulty',
                        time: 30000,
                        max: 1
                    });

                    difficultyCollector.on('collect', async (interaction) => {
                        interaction.deferUpdate();
                        const difficulty = interaction.values[0];
                        captchaDifficulty = difficulty;
                        captcha.set(`captcha_difficulty_${message.guild.id}`, difficulty);

                        const successEmbed = new Discord.MessageEmbed()
                            .setTitle('Configuration du Captcha')
                            .setDescription(`
La difficulté du captcha a été définie sur ${difficulty}.

**État actuel:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${verificationChannel ? `<#${verificationChannel}>` : 'Non défini'}
**Rôle vérifié:** ${verifiedRole ? `<@&${verifiedRole}>` : 'Non défini'}
**Difficulté:** ${difficulty}
**Délai d'expiration:** ${captchaTimeout} secondes

*Sélectionnez une option dans le menu ci-dessous pour configurer le système de captcha.*
                            `)
                            .setColor(color)
                            .setFooter({ text: footer });

                        await msg.edit({ embeds: [successEmbed] });
                        difficultyMsg.delete().catch(() => {});
                    });

                    difficultyCollector.on('end', (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            difficultyMsg.delete().catch(() => {});
                        }
                    });
                } else if (value === 'timeout') {
                    // Demander le délai d'expiration
                    const promptEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration du Captcha')
                        .setDescription(`Entrez le délai d'expiration en secondes (30-600).`)
                        .setColor(color)
                        .setFooter({ text: footer });

                    const promptMsg = await message.channel.send({ embeds: [promptEmbed] });

                    const filter = m => m.author.id === message.author.id;
                    const timeoutCollector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

                    timeoutCollector.on('collect', async (m) => {
                        const timeout = parseInt(m.content);

                        if (!isNaN(timeout) && timeout >= 30 && timeout <= 600) {
                            captchaTimeout = timeout;
                            captcha.set(`captcha_timeout_${message.guild.id}`, timeout);

                            const successEmbed = new Discord.MessageEmbed()
                                .setTitle('Configuration du Captcha')
                                .setDescription(`
Le délai d'expiration a été défini sur ${timeout} secondes.

**État actuel:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${verificationChannel ? `<#${verificationChannel}>` : 'Non défini'}
**Rôle vérifié:** ${verifiedRole ? `<@&${verifiedRole}>` : 'Non défini'}
**Difficulté:** ${captchaDifficulty}
**Délai d'expiration:** ${timeout} secondes

*Sélectionnez une option dans le menu ci-dessous pour configurer le système de captcha.*
                                `)
                                .setColor(color)
                                .setFooter({ text: footer });

                            await msg.edit({ embeds: [successEmbed] });
                        } else {
                            const errorEmbed = new Discord.MessageEmbed()
                                .setTitle('Configuration du Captcha')
                                .setDescription(`Délai invalide. Veuillez entrer un nombre entre 30 et 600.`)
                                .setColor('RED')
                                .setFooter({ text: footer });

                            await message.channel.send({ embeds: [errorEmbed] });
                        }

                        promptMsg.delete().catch(() => {});
                        m.delete().catch(() => {});
                    });

                    timeoutCollector.on('end', (collected, reason) => {
                        if (reason === 'time' && collected.size === 0) {
                            promptMsg.delete().catch(() => {});
                        }
                    });
                } else if (value === 'test') {
                    // Tester le captcha
                    const { generateCaptcha } = require('./captchaUtils');
                    const captchaData = generateCaptcha(captchaDifficulty);

                    const testEmbed = new Discord.MessageEmbed()
                        .setTitle('Test de Captcha')
                        .setDescription(`Voici un exemple de captcha qui sera envoyé aux nouveaux membres.`)
                        .setImage(captchaData.captchaImage)
                        .setColor(color)
                        .setFooter({ text: `Code: ${captchaData.captchaText} (visible uniquement pour ce test)` });

                    await message.channel.send({ embeds: [testEmbed] });
                }
            });

            collector.on('end', () => {
                const endEmbed = new Discord.MessageEmbed()
                    .setTitle('Configuration du Captcha')
                    .setDescription(`
Configuration terminée. Voici les paramètres actuels:

**État:** ${captchaEnabled ? '✅ Activé' : '❌ Désactivé'}
**Salon de vérification:** ${verificationChannel ? `<#${verificationChannel}>` : 'Non défini'}
**Rôle vérifié:** ${verifiedRole ? `<@&${verifiedRole}>` : 'Non défini'}
**Difficulté:** ${captchaDifficulty}
**Délai d'expiration:** ${captchaTimeout} secondes
                    `)
                    .setColor(color)
                    .setFooter({ text: footer });

                msg.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
            });
        } else {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }
    }
};