const Discord = require('discord.js')
const db = require("quick.db")
const owner = new db.table("Owner")
const punish = new db.table("Punition")
const wl = new db.table("Whitelist")
const atc = new db.table("antichannelcreate")
const config = require('../config')
const { updateCounter } = require('../counters/counterconfig')

module.exports = {
    name: 'channelCreate',
    once: false,

    async execute(client, channel) {
        // Update channel counter
        if (channel.guild) {
            updateCounter(client, channel.guild, "channelCounter");
        }

        // Envoi du log avec le nouveau système centralisé
        if (channel.guild) {
            const audit = await channel.guild.fetchAuditLogs({type: "CHANNEL_CREATE"}).then((audit) => audit.entries.first());
            
            if (audit && audit.executor) {
                // Utilisation du nouveau LogHandler pour envoyer un log de création de salon
                client.logHandler.sendLog(channel.guild.id, "serverLogs", {
                    title: "Création de salon",
                    description: `Le salon ${channel} a été créé par <@${audit.executor.id}>`,
                    fields: [
                        { name: "Salon", value: `${channel.name} (${channel.id})`, inline: true },
                        { name: "Type", value: `${channel.type.replace("GUILD_", "")}`, inline: true },
                        { name: "Créé par", value: `<@${audit.executor.id}> (${audit.executor.tag})`, inline: true }
                    ],
                    color: "#00FF00",
                    thumbnail: channel.guild.iconURL({ dynamic: true })
                });
            }
        }

        // Vérification antiraid
        if (channel.guild && atc.get(`config.${channel.guild.id}.antichannelcreate`) == true) {
            const audit = await channel.guild.fetchAuditLogs({type: "CHANNEL_CREATE"}).then((audit) => audit.entries.first());
            if (!audit || !audit.executor) return;
            if (audit.executor.id === client.user.id) return;
            if (owner.get(`owners.${audit.executor.id}`) || wl.get(`${channel.guild.id}.${audit.executor.id}.wl`) || config.bot.buyer === audit.executor.id === true || client.user.id === audit.executor.id === true) return;
            
            channel.delete().catch(() => false);

            // Application de la sanction
            let sanctionType = punish.get(`sanction_${channel.guild.id}`);
            let sanctionApplied = false;

            if (sanctionType === "ban") {
                channel.guild.members.ban(audit.executor.id, { reason: `AntiChannel Create` });
                sanctionApplied = true;
            } else if (sanctionType === "kick") {
                channel.guild.members.kick(audit.executor.id, { reason: `AntiChannel Create` });
                sanctionApplied = true;
            } else if (sanctionType === "derank") {
                const member = await channel.guild.members.fetch(audit.executor.id).catch(() => null);
                if (member) {
                    member.roles.set([], "AntiChannel Create").catch(() => false);
                    sanctionApplied = true;
                }
            }

            // Envoi du log de sanction avec le nouveau système
            if (sanctionApplied) {
                client.logHandler.sendLog(channel.guild.id, "raidLogs", {
                    title: "Protection AntiRaid",
                    description: `<@${audit.executor.id}> a tenté de \`créer\` un salon, il a été sanctionné.`,
                    fields: [
                        { name: "Utilisateur", value: `<@${audit.executor.id}> (${audit.executor.tag})`, inline: true },
                        { name: "ID", value: audit.executor.id, inline: true },
                        { name: "Sanction", value: sanctionType, inline: true },
                        { name: "Salon", value: channel.name, inline: true }
                    ],
                    color: "#FF0000",
                    footer: "Protection AntiRaid"
                });
            }
        }
    }
}