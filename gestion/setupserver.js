const Discord = require("discord.js")
const db = require('quick.db')
const owner = new db.table("Owner")
const cl = new db.table("Color")
const config = require("../config")

module.exports = {
    name: 'setupserver',
    usage: 'setupserver',
    category: "gestion",
    description: `Permet de configurer automatiquement le serveur avec tous les salons nécessaires.`,
    async execute(client, message, args) {

        if (owner.get(`owners.${message.author.id}`) || config.bot.buyer === message.author.id || message.guild.ownerId === message.author.id) {

            let color = cl.fetch(`color_${message.guild.id}`)
            if (color == null) color = config.bot.couleur

            // Création des différentes catégories
            const setupEmbed = new Discord.MessageEmbed()
                .setTitle('🔧 Configuration du serveur')
                .setDescription('Quels éléments souhaitez-vous configurer ?')
                .setColor(color)
                .setFooter({ text: config.bot.footer })

            const row = new Discord.MessageActionRow().addComponents(
                new Discord.MessageSelectMenu()
                    .setCustomId('setup_select')
                    .setPlaceholder('Sélectionnez les options à configurer')
                    .setMinValues(1)
                    .setMaxValues(7)
                    .addOptions([
                        {
                            label: 'Tout configurer',
                            description: 'Configure tous les éléments du serveur',
                            value: 'all',
                            emoji: '⚙️'
                        },
                        {
                            label: 'Salons de logs',
                            description: 'Crée tous les salons de logs nécessaires',
                            value: 'logs',
                            emoji: '📝'
                        },
                        {
                            label: 'Salons généraux',
                            description: 'Crée des salons textuels et vocaux généraux',
                            value: 'general',
                            emoji: '💬'
                        },
                        {
                            label: 'Salons mini-jeux',
                            description: 'Crée des salons pour les mini-jeux',
                            value: 'minigames',
                            emoji: '🎮'
                        },
                        {
                            label: 'Salons de support',
                            description: 'Crée des salons pour le système de tickets et ModMail',
                            value: 'support',
                            emoji: '🎫'
                        },
                        {
                            label: 'Salons économie',
                            description: 'Crée des salons pour le système économique',
                            value: 'economy',
                            emoji: '💰'
                        },
                        {
                            label: 'Salons modération',
                            description: 'Crée des salons pour la modération',
                            value: 'moderation',
                            emoji: '🛡️'
                        },
                        {
                            label: 'Rôles serveur',
                            description: 'Crée tous les rôles nécessaires pour le serveur',
                            value: 'roles',
                            emoji: '👑'
                        }
                    ])
            )

            const setupMessage = await message.channel.send({ embeds: [setupEmbed], components: [row] })

            // Création du collecteur pour le menu
            const collector = setupMessage.createMessageComponentCollector({
                componentType: 'SELECT_MENU',
                filter: i => i.user.id === message.author.id,
                time: 120000
            })

            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate()
                const selected = interaction.values

                const loadingEmbed = new Discord.MessageEmbed()
                    .setDescription('⏳ Configuration du serveur en cours...')
                    .setColor(color)
                
                await setupMessage.edit({ embeds: [loadingEmbed], components: [] })

                // Créer les catégories, salons et rôles
                let createdChannels = []
                let createdRoles = []

                // Fonction pour créer une catégorie s'il n'existe pas déjà
                const createCategory = async (name) => {
                    const existingCategory = message.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === name)
                    if (existingCategory) return existingCategory
                    
                    const category = await message.guild.channels.create(name, {
                        type: 'GUILD_CATEGORY',
                        permissionOverwrites: [
                            {
                                id: message.guild.id,
                                allow: ['VIEW_CHANNEL']
                            }
                        ]
                    })
                    createdChannels.push(`📁 Catégorie: ${category.name}`)
                    return category
                }

                // Fonction pour créer un salon textuel
                const createTextChannel = async (name, category, permissions = null) => {
                    const existingChannel = message.guild.channels.cache.find(c => c.type === 'GUILD_TEXT' && c.name === name && (category ? c.parentId === category.id : true))
                    if (existingChannel) return existingChannel

                    const channelOptions = {
                        type: 'GUILD_TEXT',
                        parent: category
                    }

                    if (permissions) {
                        channelOptions.permissionOverwrites = permissions
                    }
                    
                    const channel = await message.guild.channels.create(name, channelOptions)
                    createdChannels.push(`💬 Salon: ${channel.name}`)
                    return channel
                }

                // Fonction pour créer un salon vocal
                const createVoiceChannel = async (name, category, permissions = null) => {
                    const existingChannel = message.guild.channels.cache.find(c => c.type === 'GUILD_VOICE' && c.name === name && (category ? c.parentId === category.id : true))
                    if (existingChannel) return existingChannel

                    const channelOptions = {
                        type: 'GUILD_VOICE',
                        parent: category
                    }

                    if (permissions) {
                        channelOptions.permissionOverwrites = permissions
                    }
                    
                    const channel = await message.guild.channels.create(name, channelOptions)
                    createdChannels.push(`🔊 Vocal: ${channel.name}`)
                    return channel
                }

                // Configuration des salons de logs
                if (selected.includes('logs') || selected.includes('all')) {
                    const logsCategory = await createCategory('📋 Logs')
                    
                    // Création des salons de logs
                    await createTextChannel('logs-messages', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        },
                        {
                            id: message.guild.roles.cache.find(r => r.name === '@everyone').id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-modération', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-raid', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-tickets', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-giveaways', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-boosts', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-joinleave', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-roles', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-modmail', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-captcha', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])
                    await createTextChannel('logs-economy', logsCategory, [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ])

                    // Configuration des logs dans la DB
                    const messageLogs = message.guild.channels.cache.find(c => c.name === 'logs-messages')
                    if (messageLogs) db.set(`${message.guild.id}.messagelog`, messageLogs.id)
                    
                    const modLogs = message.guild.channels.cache.find(c => c.name === 'logs-modération')
                    if (modLogs) db.set(`${message.guild.id}.modlog`, modLogs.id)
                    
                    const raidLogs = message.guild.channels.cache.find(c => c.name === 'logs-raid')
                    if (raidLogs) db.set(`${message.guild.id}.raidlog`, raidLogs.id)
                    
                    const ticketLogs = message.guild.channels.cache.find(c => c.name === 'logs-tickets')
                    if (ticketLogs) db.set(`${message.guild.id}.ticketlog`, ticketLogs.id)
                    
                    const giveawayLogs = message.guild.channels.cache.find(c => c.name === 'logs-giveaways')
                    if (giveawayLogs) db.set(`${message.guild.id}.giveawaylog`, giveawayLogs.id)
                    
                    const boostLogs = message.guild.channels.cache.find(c => c.name === 'logs-boosts')
                    if (boostLogs) db.set(`${message.guild.id}.boostlog`, boostLogs.id)
                    
                    const roleLogs = message.guild.channels.cache.find(c => c.name === 'logs-roles')
                    if (roleLogs) db.set(`${message.guild.id}.rolelog`, roleLogs.id)
                    
                    const modmailLogs = message.guild.channels.cache.find(c => c.name === 'logs-modmail')
                    if (modmailLogs) db.set(`${message.guild.id}.modmaillog`, modmailLogs.id)
                }

                // Configuration des salons généraux
                if (selected.includes('general') || selected.includes('all')) {
                    const generalCategory = await createCategory('💬 Général')
                    
                    // Création des salons textuels généraux
                    await createTextChannel('règlement', generalCategory)
                    await createTextChannel('annonces', generalCategory)
                    await createTextChannel('général', generalCategory)
                    await createTextChannel('discussions', generalCategory)
                    await createTextChannel('médias', generalCategory)
                    await createTextChannel('commandes', generalCategory)
                    await createTextChannel('bienvenue', generalCategory)
                    
                    // Création des salons vocaux
                    const voiceCategory = await createCategory('🔊 Vocal')
                    await createVoiceChannel('Général', voiceCategory)
                    await createVoiceChannel('Jeux', voiceCategory)
                    await createVoiceChannel('AFK', voiceCategory)
                    
                    // Salon de création de vocal temporaire
                    await createVoiceChannel('➕ Créer un salon', voiceCategory)
                    
                    // Configuration du salon de bienvenue dans la DB
                    const welcomeChannel = message.guild.channels.cache.find(c => c.name === 'bienvenue')
                    if (welcomeChannel) {
                        db.set(`salonbvn_${message.guild.id}`, welcomeChannel.id)
                        db.set(`messagebvn_${message.guild.id}`, '{MemberMention} a rejoint le serveur ! Nous sommes maintenant {MemberCount} membres !')
                        db.set(`joinsettings_${message.guild.id}`, true)
                    }
                }

                // Configuration des salons mini-jeux
                if (selected.includes('minigames') || selected.includes('all')) {
                    const minigamesCategory = await createCategory('🎮 Mini-jeux')
                    
                    await createTextChannel('coinflip', minigamesCategory)
                    await createTextChannel('dice', minigamesCategory)
                    await createTextChannel('rps', minigamesCategory)
                    await createTextChannel('slots', minigamesCategory)
                    await createTextChannel('8ball', minigamesCategory)
                    await createTextChannel('classements', minigamesCategory)
                }

                // Configuration des salons de support
                if (selected.includes('support') || selected.includes('all')) {
                    const supportCategory = await createCategory('🎫 Support')
                    
                    // Salons pour les tickets
                    await createTextChannel('créer-un-ticket', supportCategory)
                    
                    // Salon pour le captcha
                    await createTextChannel('vérification', supportCategory)
                    
                    // Catégorie pour les tickets
                    const ticketCategory = await createCategory('🎫 Tickets')
                    db.set(`${message.guild.id}.categorieticket`, ticketCategory.id)

                    // Catégorie pour les tickets ModMail
                    const modmailCategory = await createCategory('📨 ModMail')
                    
                    // Configuration du ModMail
                    const modmailChannel = message.guild.channels.cache.find(c => c.name === 'logs-modmail')
                    if (modmailChannel) {
                        db.set(`modmail_${message.guild.id}`, {
                            enabled: true,
                            logChannel: modmailChannel.id,
                            category: modmailCategory.id,
                            welcomeMessage: "Bonjour {user}, vous avez ouvert un ticket avec le staff. Veuillez expliquer votre problème et un membre du staff vous répondra dès que possible."
                        })
                    }
                }

                // Configuration des salons économie
                if (selected.includes('economy') || selected.includes('all')) {
                    const economyCategory = await createCategory('💰 Économie')
                    
                    await createTextChannel('boutique', economyCategory)
                    await createTextChannel('travail', economyCategory)
                    await createTextChannel('classement-économie', economyCategory)
                    await createTextChannel('daily', economyCategory)
                    
                    // Configuration des logs d'économie
                    const economyLogs = message.guild.channels.cache.find(c => c.name === 'logs-economy')
                    if (economyLogs) db.set(`${message.guild.id}.economylog`, economyLogs.id)
                }

                // Configuration des salons modération
                // Fonction pour créer un rôle
                const createRole = async (name, color, permissions = null, hoist = false, mentionable = false, position = 0) => {
                    const existingRole = message.guild.roles.cache.find(r => r.name === name)
                    if (existingRole) return existingRole
                    
                    const roleOptions = {
                        name: name,
                        color: color,
                        hoist: hoist,
                        mentionable: mentionable,
                        reason: 'Création automatique via setupserver'
                    }
                    
                    if (permissions) {
                        roleOptions.permissions = permissions
                    }
                    
                    const role = await message.guild.roles.create(roleOptions)
                    createdRoles.push(`👑 Rôle: ${role.name}`)
                    return role
                }

                // Création des rôles
                if (selected.includes('roles') || selected.includes('all')) {
                    // Créer les rôles par ordre d'importance (du plus élevé au plus bas)
                    
                    // Rôle Fondateur avec permissions administrateur
                    const founderRole = await createRole('👑 Fondateur', '#ff0000', ['ADMINISTRATOR'], true, true)
                    
                    // Rôle Administrateur avec permissions élevées
                    const adminPerms = [
                        'ADMINISTRATOR'
                    ]
                    const adminRole = await createRole('🔱 Administrateur', '#ff7700', adminPerms, true, true)
                    
                    // Rôle Responsable
                    const respPerms = [
                        'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS',
                        'MANAGE_MESSAGES', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS'
                    ]
                    const respRole = await createRole('🔰 Responsable', '#ffaa00', respPerms, true, true)
                    
                    // Rôle Modérateur
                    const modPerms = [
                        'MANAGE_MESSAGES', 'KICK_MEMBERS', 'MUTE_MEMBERS', 'MOVE_MEMBERS'
                    ]
                    const modRole = await createRole('🛡️ Modérateur', '#00aaff', modPerms, true, true)
                    
                    // Rôle Support
                    const supportPerms = [
                        'MANAGE_MESSAGES', 'MUTE_MEMBERS'
                    ]
                    const supportRole = await createRole('🔧 Support', '#00ffaa', supportPerms, true, true)
                    
                    // Rôle Partenaire
                    const partnerRole = await createRole('🤝 Partenaire', '#aa00ff', null, true, true)
                    
                    // Rôle VIP
                    const vipRole = await createRole('💎 VIP', '#ff00aa', null, true, true)
                    
                    // Rôle Booster
                    const boosterRole = await createRole('💖 Booster', '#ff73fa', null, true, true)
                    
                    // Rôles de niveaux
                    const level100Role = await createRole('🔆 Niveau 100', '#ffdd00', null, true, false)
                    const level50Role = await createRole('⭐ Niveau 50', '#ffee55', null, true, false)
                    const level25Role = await createRole('✨ Niveau 25', '#ffff99', null, true, false)
                    
                    // Rôle Membre vérifié
                    const verifiedRole = await createRole('✅ Membre vérifié', '#00cc44', null, true, false)
                    
                    // Rôle Membre
                    const memberRole = await createRole('👤 Membre', '#bbbbbb', null, true, false)
                    
                    // Rôles de couleurs
                    await createRole('🔴 Rouge', '#ff0000')
                    await createRole('🟠 Orange', '#ff7700')
                    await createRole('🟡 Jaune', '#ffff00')
                    await createRole('🟢 Vert', '#00ff00')
                    await createRole('🔵 Bleu', '#0000ff')
                    await createRole('🟣 Violet', '#aa00ff')
                    await createRole('⚫ Noir', '#000000')
                    await createRole('⚪ Blanc', '#ffffff')
                    
                    // Mettre à jour les configurations
                    // Rôle de membre par défaut
                    db.set(`joinrole_${message.guild.id}`, memberRole.id)
                    
                    // Configuration du captcha
                    const verificationChannel = message.guild.channels.cache.find(c => c.name === 'vérification')
                    if (verificationChannel && verifiedRole) {
                        db.set(`captcha_${message.guild.id}`, {
                            enabled: true,
                            channelId: verificationChannel.id,
                            roleId: verifiedRole.id,
                            difficulty: 'medium',
                            timeout: 120
                        })
                    }
                    
                    // Configuration des permissions pour les rôles staff
                    if (adminRole) {
                        db.set(`perm3_${message.guild.id}`, adminRole.id)
                    }
                    if (respRole) {
                        db.set(`perm2_${message.guild.id}`, respRole.id)
                    }
                    if (modRole) {
                        db.set(`perm1_${message.guild.id}`, modRole.id)
                    }
                    
                    // Configuration des permissions de ticket pour le support
                    if (supportRole) {
                        db.set(`ticketrole_${message.guild.id}`, supportRole.id)
                    }
                }

                if (selected.includes('moderation') || selected.includes('all')) {
                    const moderationCategory = await createCategory('🛡️ Modération')
                    
                    // Trouver les rôles de staff
                    const staffRoles = message.guild.roles.cache.filter(r => 
                        r.name === '🔱 Administrateur' || 
                        r.name === '🛡️ Modérateur' || 
                        r.name === '🔰 Responsable' ||
                        r.name === '🔧 Support'
                    )
                    
                    const staffPerms = [
                        {
                            id: message.guild.id,
                            deny: ['VIEW_CHANNEL']
                        }
                    ]
                    
                    // Ajouter les permissions pour les rôles staff
                    staffRoles.forEach(role => {
                        staffPerms.push({
                            id: role.id,
                            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                        })
                    })
                    
                    await createTextChannel('logs-automod', moderationCategory, staffPerms)
                    await createTextChannel('commandes-staff', moderationCategory, staffPerms)
                    await createTextChannel('discussions-staff', moderationCategory, staffPerms)
                    
                    await createVoiceChannel('Vocal Staff', moderationCategory, staffPerms)
                }

                // Mise à jour du système de logs centralisé
                if (selected.includes('logs') || selected.includes('all')) {
                    // Configurer le nouveau système de logs centralisé
                    const logChannels = {
                        memberLogs: message.guild.channels.cache.find(c => c.name === 'logs-joinleave')?.id,
                        messageLogs: message.guild.channels.cache.find(c => c.name === 'logs-messages')?.id,
                        moderationLogs: message.guild.channels.cache.find(c => c.name === 'logs-modération')?.id,
                        raidLogs: message.guild.channels.cache.find(c => c.name === 'logs-raid')?.id,
                        ticketLogs: message.guild.channels.cache.find(c => c.name === 'logs-tickets')?.id,
                        giveawayLogs: message.guild.channels.cache.find(c => c.name === 'logs-giveaways')?.id,
                        boostLogs: message.guild.channels.cache.find(c => c.name === 'logs-boosts')?.id,
                        roleLogs: message.guild.channels.cache.find(c => c.name === 'logs-roles')?.id,
                        modmailLogs: message.guild.channels.cache.find(c => c.name === 'logs-modmail')?.id,
                        captchaLogs: message.guild.channels.cache.find(c => c.name === 'logs-captcha')?.id,
                        serverLogs: message.guild.channels.cache.find(c => c.name === 'logs-modération')?.id
                    }
                    
                    // Stocker la configuration dans la base de données
                    db.set(`logs_${message.guild.id}`, {
                        enabled: true,
                        channels: logChannels
                    })
                }
                // Message de complétion
                let description = '';
                
                if (createdChannels.length > 0) {
                    description += `**Salons créés (${createdChannels.length}):**\n${createdChannels.join('\n')}\n\n`;
                }
                
                if (createdRoles.length > 0) {
                    description += `**Rôles créés (${createdRoles.length}):**\n${createdRoles.join('\n')}`;
                }
                
                const resultEmbed = new Discord.MessageEmbed()
                    .setTitle('✅ Configuration terminée')
                    .setDescription(description)
                    .setColor(color)
                    .setFooter({ text: config.bot.footer })

                // Bouton pour supprimer en cas d'erreur
                const resetButton = new Discord.MessageActionRow().addComponents(
                    new Discord.MessageButton()
                        .setCustomId('resetChannels')
                        .setLabel('Annuler les changements')
                        .setStyle('DANGER')
                        .setEmoji('🗑️')
                )

                await setupMessage.edit({ embeds: [resultEmbed], components: [resetButton] })

                // Collecteur pour le bouton de réinitialisation
                const buttonCollector = setupMessage.createMessageComponentCollector({
                    componentType: 'BUTTON',
                    filter: i => i.user.id === message.author.id && i.customId === 'resetChannels',
                    time: 60000
                })

                buttonCollector.on('collect', async (interaction) => {
                    await interaction.deferUpdate()
                    
                    const confirmEmbed = new Discord.MessageEmbed()
                        .setTitle('❓ Confirmation')
                        .setDescription('Êtes-vous sûr de vouloir supprimer tous les salons créés ? Cette action est irréversible.')
                        .setColor(color)
                    
                    const confirmRow = new Discord.MessageActionRow().addComponents(
                        new Discord.MessageButton()
                            .setCustomId('confirmReset')
                            .setLabel('Oui, supprimer')
                            .setStyle('DANGER'),
                        new Discord.MessageButton()
                            .setCustomId('cancelReset')
                            .setLabel('Non, annuler')
                            .setStyle('SUCCESS')
                    )
                    
                    await setupMessage.edit({ embeds: [confirmEmbed], components: [confirmRow] })
                    
                    const confirmCollector = setupMessage.createMessageComponentCollector({
                        componentType: 'BUTTON',
                        filter: i => i.user.id === message.author.id && ['confirmReset', 'cancelReset'].includes(i.customId),
                        time: 30000
                    })
                    
                    confirmCollector.on('collect', async (buttonInteraction) => {
                        await buttonInteraction.deferUpdate()
                        
                        if (buttonInteraction.customId === 'confirmReset') {
                            const loadingResetEmbed = new Discord.MessageEmbed()
                                .setDescription('⏳ Suppression des salons en cours...')
                                .setColor(color)
                            
                            await setupMessage.edit({ embeds: [loadingResetEmbed], components: [] })
                            
                            // Supprimer les salons créés
                            let deletedCount = 0
                            
                            for (const channelName of createdChannels) {
                                const name = channelName.split(': ')[1]
                                const channel = message.guild.channels.cache.find(c => c.name === name)
                                
                                if (channel) {
                                    await channel.delete().catch(() => null)
                                    deletedCount++
                                }
                            }
                            
                            const resetCompleteEmbed = new Discord.MessageEmbed()
                                .setTitle('✅ Réinitialisation terminée')
                                .setDescription(`J'ai supprimé **${deletedCount}** salons et catégories.`)
                                .setColor(color)
                            
                            await setupMessage.edit({ embeds: [resetCompleteEmbed], components: [] })
                        } else {
                            await setupMessage.edit({ embeds: [resultEmbed], components: [] })
                        }
                    })
                })
            })

        } else {
            message.channel.send(`Vous n'avez pas la permission d'utiliser cette commande.`)
        }
    }
}