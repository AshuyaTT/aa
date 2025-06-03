const Discord = require('discord.js')
const moment = require('moment');
const config = require('../config')
const db = require("quick.db")
const cl = new db.table("Color")
const owner = new db.table("Owner")
const rlog = new db.table("raidlog")
const punish = new db.table("Punition")
const lock = new db.table("Serverlock")
const atb = new db.table("Antibot")
const { updateCounter } = require('../counters/counterconfig')
const inviteTracker = require('../invites/inviteTracker')
const { generateCaptcha, createVerificationSession, getVerificationSettings, verifyCaptcha } = require('../captcha/captchaUtils')

module.exports = {
    name: 'guildMemberAdd',
    once: false,

    async execute(client, member) {
        // Invite tracking
        const inviteEnabled = db.get(`inviteEnabled_${member.guild.id}`);
        if (inviteEnabled !== false) {
            try {
                // Find the inviter
                const inviteInfo = await inviteTracker.findInviter(member);
                
                if (inviteInfo && inviteInfo.inviter) {
                    // Store the inviter
                    inviteTracker.setInviter(member.guild.id, member.id, inviteInfo.inviter.id);
                    
                    // Add invite to the inviter
                    inviteTracker.addInvite(member.guild.id, inviteInfo.inviter.id, member.id);
                    
                    // Send invite log if channel is configured
                    const inviteChannel = db.get(`inviteChannel_${member.guild.id}`);
                    if (inviteChannel) {
                        const inviteMessage = db.get(`inviteMessage_${member.guild.id}`) || 
                            `{user} a rejoint le serveur, invité par {inviter} (qui a maintenant {invites} invitations) !`;
                        
                        const inviteCount = inviteTracker.getInviteCount(member.guild.id, inviteInfo.inviter.id);
                        
                        const content = inviteMessage
                            .replace(/{user}/g, `<@${member.id}>`)
                            .replace(/{username}/g, member.user.username)
                            .replace(/{server}/g, member.guild.name)
                            .replace(/{inviter}/g, `<@${inviteInfo.inviter.id}>`)
                            .replace(/{invitername}/g, inviteInfo.inviter.username)
                            .replace(/{invites}/g, inviteCount);
                        
                        const channel = client.channels.cache.get(inviteChannel);
                        if (channel) channel.send({ content }).catch(() => false);
                    }
                }
            } catch (error) {
                console.error(`Erreur lors du suivi d'invitation pour ${member.user.tag}: ${error.message}`);
            }
        }
        // Update member counter
        updateCounter(client, member.guild, "memberCounter");
        
        // If the member is a bot, update bot counter
        if (member.user.bot) {
            updateCounter(client, member.guild, "botCounter");
        }
        
        // Update online counter
        updateCounter(client, member.guild, "onlineCounter");

        let color = cl.fetch(`color_${member.guild.id}`)
        if (color == null) color = config.bot.couleur

        // Check if captcha verification is enabled
        const captchaSettings = getVerificationSettings(member.guild.id);
        if (captchaSettings && captchaSettings.enabled && !member.user.bot) {
            // Get verification channel and role
            const verificationChannel = client.channels.cache.get(captchaSettings.channelId);
            const verifiedRole = member.guild.roles.cache.get(captchaSettings.roleId);
            
            if (verificationChannel && verifiedRole) {
                try {
                    // Generate captcha based on difficulty
                    const { captchaText, captchaImage, canvasAvailable } = generateCaptcha(captchaSettings.difficulty);
                    
                    // Create verification session with timeout
                    createVerificationSession(member.guild.id, member.id, captchaText, captchaSettings.timeout);
                    
                    // Create captcha embed
                    const captchaEmbed = new Discord.MessageEmbed()
                        .setTitle(`Vérification Captcha - ${member.user.tag}`)
                        .setColor(color)
                        .setFooter({ text: `ID: ${member.id} • Difficulté: ${captchaSettings.difficulty}` })
                        .setTimestamp();
                    
                    if (canvasAvailable && captchaImage) {
                        captchaEmbed.setDescription(`Bienvenue sur **${member.guild.name}**!\nPour accéder au serveur, veuillez entrer le code affiché dans l'image ci-dessous.\nVous avez **${captchaSettings.timeout}** secondes pour répondre.`)
                        captchaEmbed.setImage(captchaImage);
                    } else {
                        captchaEmbed.setDescription(`Bienvenue sur **${member.guild.name}**!\nPour accéder au serveur, veuillez entrer le code suivant: **${captchaText}**\nVous avez **${captchaSettings.timeout}** secondes pour répondre.`);
                    }
                    
                    // Create verification components
                    const row = new Discord.MessageActionRow()
                        .addComponents(
                            new Discord.MessageButton()
                                .setCustomId(`captcha_verify_${member.id}`)
                                .setLabel('Vérifier')
                                .setStyle('SUCCESS'),
                            new Discord.MessageButton()
                                .setCustomId(`captcha_cancel_${member.id}`)
                                .setLabel('Annuler')
                                .setStyle('DANGER')
                        );
                    
                    // Send captcha to verification channel
                    const captchaMessage = await verificationChannel.send({
                        content: `<@${member.id}>, veuillez compléter la vérification captcha.`,
                        embeds: [captchaEmbed],
                        components: [row]
                    });
                    
                    // Create collector for the verification buttons
                    const filter = i => i.customId.startsWith('captcha_') && i.customId.endsWith(member.id);
                    const collector = captchaMessage.createMessageComponentCollector({ 
                        filter, 
                        time: captchaSettings.timeout * 1000 
                    });
                    
                    // Handle button interactions
                    collector.on('collect', async interaction => {
                        if (interaction.customId === `captcha_verify_${member.id}`) {
                            // Show modal for captcha input
                            const modal = new Discord.Modal()
                                .setCustomId(`captcha_modal_${member.id}`)
                                .setTitle('Vérification Captcha');
                            
                            const captchaInput = new Discord.TextInputComponent()
                                .setCustomId('captchaInput')
                                .setLabel('Entrez le code captcha')
                                .setStyle('SHORT')
                                .setMinLength(captchaText.length)
                                .setMaxLength(captchaText.length)
                                .setPlaceholder('Entrez le code ici...')
                                .setRequired(true);
                            
                            const actionRow = new Discord.MessageActionRow().addComponents(captchaInput);
                            modal.addComponents(actionRow);
                            
                            await interaction.showModal(modal);
                        } else if (interaction.customId === `captcha_cancel_${member.id}`) {
                            collector.stop('cancelled');
                            await interaction.reply({ 
                                content: `Vérification annulée. ${member} sera expulsé du serveur.`,
                                ephemeral: true 
                            });
                        }
                    });
                    
                    // Handle modal submissions
                    client.on('interactionCreate', async interaction => {
                        if (!interaction.isModalSubmit()) return;
                        if (interaction.customId !== `captcha_modal_${member.id}`) return;
                        
                        const response = interaction.fields.getTextInputValue('captchaInput');
                        
                        // Verify captcha response
                        const result = await verifyCaptcha(member.guild.id, member.id, response);
                        
                        if (result.success) {
                            // Verification successful
                            await interaction.reply({ 
                                content: `✅ Vérification réussie! Bienvenue sur ${member.guild.name}!`,
                                ephemeral: true 
                            });
                            
                            // Add verified role
                            await member.roles.add(verifiedRole).catch(console.error);
                            
                            // Update captcha message
                            const successEmbed = new Discord.MessageEmbed()
                                .setTitle(`Vérification Réussie - ${member.user.tag}`)
                                .setDescription(`${member} a complété la vérification captcha avec succès!`)
                                .setColor('#00FF00')
                                .setTimestamp();
                            
                            await captchaMessage.edit({
                                content: null,
                                embeds: [successEmbed],
                                components: []
                            }).catch(console.error);
                            
                            collector.stop('success');
                        } else {
                            // Verification failed
                            await interaction.reply({ 
                                content: `❌ Code incorrect. ${result.attemptsLeft} tentatives restantes.`,
                                ephemeral: true 
                            });
                            
                            if (result.attemptsLeft <= 0) {
                    collector.stop('failed');
                }
            }
        });
        
        // Handle collector end
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                // Timeout
                const timeoutEmbed = new Discord.MessageEmbed()
                    .setTitle(`Vérification Expirée - ${member.user.tag}`)
                    .setDescription(`${member} n'a pas complété la vérification à temps et sera expulsé.`)
                    .setColor('#FF0000')
                    .setTimestamp();
                
                await captchaMessage.edit({
                    content: null,
                    embeds: [timeoutEmbed],
                    components: []
                }).catch(console.error);
                
                // Log captcha timeout with new LogHandler
                client.logHandler.sendLog(member.guild.id, "captchaLogs", {
                    title: "Captcha - Vérification Expirée",
                    description: `${member} n'a pas complété la vérification à temps et a été expulsé.`,
                    fields: [
                        { name: "Utilisateur", value: `${member.user.tag} (${member.id})`, inline: true },
                        { name: "Raison", value: "Temps expiré", inline: true },
                        { name: "Action", value: "Expulsion", inline: true }
                    ],
                    color: "#FF0000",
                    thumbnail: member.user.displayAvatarURL({ dynamic: true })
                });
                
                // Kick member
                await member.kick('Captcha verification timeout').catch(console.error);
            } else if (reason === 'failed' || reason === 'cancelled') {
                // Failed verification
                const failedEmbed = new Discord.MessageEmbed()
                    .setTitle(`Vérification Échouée - ${member.user.tag}`)
                    .setDescription(`${member} n'a pas réussi à compléter la vérification et sera expulsé.`)
                    .setColor('#FF0000')
                    .setTimestamp();
                
                await captchaMessage.edit({
                    content: null,
                    embeds: [failedEmbed],
                    components: []
                }).catch(console.error);
                
                // Log captcha failure with new LogHandler
                client.logHandler.sendLog(member.guild.id, "captchaLogs", {
                    title: "Captcha - Vérification Échouée",
                    description: `${member} n'a pas réussi à compléter la vérification et a été expulsé.`,
                    fields: [
                        { name: "Utilisateur", value: `${member.user.tag} (${member.id})`, inline: true },
                        { name: "Raison", value: reason === 'failed' ? "Code incorrect" : "Annulé par l'utilisateur", inline: true },
                        { name: "Action", value: "Expulsion", inline: true }
                    ],
                    color: "#FF0000",
                    thumbnail: member.user.displayAvatarURL({ dynamic: true })
                });
                
                // Kick member
                await member.kick('Failed captcha verification').catch(console.error);
            } else if (reason === 'success') {
                // Log successful verification
                client.logHandler.sendLog(member.guild.id, "captchaLogs", {
                    title: "Captcha - Vérification Réussie",
                    description: `${member} a complété la vérification captcha avec succès.`,
                    fields: [
                        { name: "Utilisateur", value: `${member.user.tag} (${member.id})`, inline: true },
                        { name: "Statut", value: "Vérifié", inline: true }
                    ],
                    color: "#00FF00",
                    thumbnail: member.user.displayAvatarURL({ dynamic: true })
                });
            }
        });
                    
                    // Return early to prevent welcome messages until verification is complete
                    return;
                } catch (error) {
                    console.error(`Error in captcha verification for ${member.user.tag}:`, error);
                    // Continue with normal join process if captcha fails
                }
            }
        }
        
        // If captcha is not enabled or verification is complete, continue with normal join process
        let rr = member.guild.roles.cache.get(db.get(`joinrole_${member.guild.id}`))
        if(rr) member.roles.add(rr.id)


        // Log member join with new LogHandler
        client.logHandler.sendLog(member.guild.id, "memberLogs", {
            title: "Membre rejoint",
            description: `${member} a rejoint le serveur`,
            fields: [
                { name: "Membre", value: `${member.user.tag} (${member.id})`, inline: true },
                { name: "Compte créé", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: "Membres total", value: `${member.guild.memberCount}`, inline: true }
            ],
            color: "#00FF00",
            thumbnail: member.user.displayAvatarURL({ dynamic: true })
        });

        // Check if server is locked
        if (lock.get(`serverlock_${member.guild.id}`) === "lock") {
            member.kick("Serveur Vérouillé")
            
            // Log server lock kick with new LogHandler
            client.logHandler.sendLog(member.guild.id, "raidLogs", {
                title: "Serveur Verrouillé - Membre Expulsé",
                description: `${member} a été **kick** pour avoir rejoint pendant que le serveur était verrouillé.`,
                fields: [
                    { name: "Utilisateur", value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: "Action", value: "Expulsion", inline: true },
                    { name: "Raison", value: "Serveur verrouillé", inline: true }
                ],
                color: "#FF0000",
                thumbnail: member.user.displayAvatarURL({ dynamic: true })
            });
        }

        // Check if member is blacklisted
        if (db.get(`blacklist.${member.id}`)) {
            member.send({ content: `Vous êtes blacklist de **${member.guild.name}** vous ne pouvez pas rejoindre le serveur` })
            member.guild.members.ban(member.id, { reason: `Blacklist` })
            
            // Log blacklist ban with new LogHandler
            client.logHandler.sendLog(member.guild.id, "raidLogs", {
                title: "Utilisateur Blacklisté - Banni",
                description: `${member} a rejoint en étant __blacklist__, il a été **banni**.`,
                fields: [
                    { name: "Utilisateur", value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: "Action", value: "Bannissement", inline: true },
                    { name: "Raison", value: "Utilisateur blacklisté", inline: true }
                ],
                color: "#FF0000",
                thumbnail: member.user.displayAvatarURL({ dynamic: true })
            });
        }


        if (member.user.bot) {

            if (atb.get(`config.${member.guild.id}.antibot`) === true) {

                const action = await member.guild.fetchAuditLogs({ limit: 1, type: "BOT_ADD" }).then(async (audit) => audit.entries.first());
                if (!audit | !audit.executor) return
                if (audit.executor.id === client.user.id) return
        
                let perm = config.bot.buyer == action.executor.id || config.bot.funny == action.executor.id || owner.get(`owners.${action.executor.id}`)

                if (!perm) {

                    member.kick('Antibot')

                    if (punish.get(`sanction_${member.guild.id}`) === "ban") {
                        member.guild.members.ban(action.executor.id, { reason: `Anti Bot` })

                    } else if (punish.get(`sanction_${member.guild.id}`) === "derank") {

                        member.guild.members.resolve(action.executor).roles.cache.forEach(role => {
                            if (role.name !== '@everyone') {
                                member.guild.members.resolve(action.executor).roles.remove(role).catch(() => false)
                            }
                        })

                    } else if (punish.get(`sanction_${member.guild.id}`) === "kick") {

                        member.guild.members.kick(action.executor.id, { reason: `Anti bot` })
                    }

                    // Log anti-bot action with new LogHandler
                    client.logHandler.sendLog(member.guild.id, "raidLogs", {
                        title: "Protection Anti-Bot",
                        description: `<@${action.executor.id}> a ajouté un \`bot\` au serveur sans autorisation.\nBot ajouté: <@${member.id}>`,
                        fields: [
                            { name: "Administrateur", value: `${action.executor.tag} (${action.executor.id})`, inline: true },
                            { name: "Bot", value: `${member.user.tag} (${member.id})`, inline: true },
                            { name: "Sanction", value: punish.get(`sanction_${member.guild.id}`) || "Aucune", inline: true },
                            { name: "Action", value: "Bot expulsé", inline: true }
                        ],
                        color: "#FF0000",
                        thumbnail: member.user.displayAvatarURL({ dynamic: true })
                    });
                }
            }
        }

        if (member.user) {

            let joinsettings = db.get(`joinsettings_${member.guild.id}`)
            if (joinsettings == null) joinsettings == true

            if (joinsettings === true) {

                const messagejoin = db.fetch(`messagebvn_${member.guild.id}`)

                const salonbvn = db.fetch(`salonbvn_${member.guild.id}`)

                const premiumTier = {
                    NONE: 0,
                    TIER_1: 1,
                    TIER_2: 2,
                    TIER_3: 3,
                };

                // Get inviter information if available
                let inviterId = inviteTracker.getInviter(member.guild.id, member.id);
                let inviter = null;
                let inviterTag = "Inconnu";
                let inviteCount = 0;
                
                if (inviterId) {
                    inviter = client.users.cache.get(inviterId);
                    if (inviter) {
                        inviterTag = inviter.tag;
                        inviteCount = inviteTracker.getInviteCount(member.guild.id, inviterId);
                    }
                }

                const content = messagejoin
                    .replaceAll('{MemberName}', member)
                    .replaceAll('{MemberMention}', `<@${member.id}>`)
                    .replaceAll('{MemberTag}', member.user.tag)
                    .replaceAll('{MemberID}', member.id)
                    .replaceAll('{Server}', member.guild)
                    .replaceAll('{MemberCount}', member.guild.memberCount)
                    .replaceAll('{ServerBoostsCount}', `${member.guild.premiumSubscriptionCount || '0'}`)
                    .replaceAll('{ServerLevel}', `${premiumTier[member.guild.premiumTier]}`)
                    .replaceAll('{VocalMembersCount}', member.guild.members.cache.filter(m => m.voice.channel).size)
                    .replaceAll('{OnlineMembersCount}', member.guild.presences.cache.filter((presence) => presence.status !== "offline").size)
                    .replaceAll('{Inviter}', inviter ? `<@${inviterId}>` : "Inconnu")
                    .replaceAll('{InviterTag}', inviterTag)
                    .replaceAll('{InviteCount}', inviteCount)

                const logchannel = client.channels.cache.get(salonbvn)
                if (logchannel) logchannel.send({ content: content }).catch(() => false)

                let joinsettingsmp = db.get(`joinsettingsmp_${member.guild.id}`)
                if (joinsettingsmp == null) joinsettingsmp == true

                if (joinsettingsmp === true) {

                    const messagejoin = db.fetch(`messagebvnmp_${member.guild.id}`)

                    const contentt = messagejoin
                        .replaceAll('{MemberName}', member)
                        .replaceAll('{MemberMention}', `<@${member.id}>`)
                        .replaceAll('{MemberTag}', member.user.tag)
                        .replaceAll('{MemberID}', member.id)
                        .replaceAll('{Server}', member.guild)
                        .replaceAll('{MemberCount}', member.guild.memberCount)
                        .replaceAll('{ServerBoostsCount}', `${member.guild.premiumSubscriptionCount || '0'}`)
                        .replaceAll('{ServerLevel}', `${premiumTier[member.guild.premiumTier]}`)
                        .replaceAll('{VocalMembersCount}', member.guild.members.cache.filter(m => m.voice.channel).size)
                        .replaceAll('{OnlineMembersCount}', member.guild.presences.cache.filter((presence) => presence.status !== "offline").size)
                        .replaceAll('{Inviter}', inviter ? `<@${inviterId}>` : "Inconnu")
                        .replaceAll('{InviterTag}', inviterTag)
                        .replaceAll('{InviteCount}', inviteCount)

                    member.send({ content: contentt }).catch(() => false)

                }


           
            }
        }
    }}
