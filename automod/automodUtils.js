const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const automod = new db.table("Automod");
const warns = new db.table("Warns");

/**
 * Applique une sanction à un utilisateur
 * @param {Discord.Client} client - Le client Discord
 * @param {Discord.Guild} guild - Le serveur
 * @param {Discord.User} user - L'utilisateur à sanctionner
 * @param {string} reason - La raison de la sanction
 * @param {string} type - Le type d'infraction (antilink, antispam, etc.)
 * @returns {Promise<void>}
 */
async function applySanction(client, guild, user, reason, type) {
    // Récupérer la sanction configurée
    const punishment = automod.get(`punishment_${guild.id}`) || "warn";
    const member = await guild.members.fetch(user.id).catch(() => null);
    
    if (!member) return; // L'utilisateur n'est plus sur le serveur
    
    // Appliquer la sanction
    switch (punishment) {
        case "warn":
            // Ajouter un avertissement
            const warnId = warns.get(`${guild.id}.warnCount`) || 0;
            warns.add(`${guild.id}.warnCount`, 1);
            warns.push(`${guild.id}.${user.id}`, {
                id: warnId + 1,
                moderator: client.user.id,
                reason: reason,
                date: Date.now()
            });
            break;
        case "mute":
            // Mute l'utilisateur pendant 10 minutes
            try {
                await member.timeout(10 * 60 * 1000, reason);
            } catch (error) {
                console.error(`Erreur lors du mute de ${user.tag}: ${error.message}`);
            }
            break;
        case "kick":
            // Expulser l'utilisateur
            try {
                await member.kick(reason);
            } catch (error) {
                console.error(`Erreur lors de l'expulsion de ${user.tag}: ${error.message}`);
            }
            break;
        case "ban":
            // Bannir l'utilisateur
            try {
                await guild.members.ban(user.id, { reason });
            } catch (error) {
                console.error(`Erreur lors du bannissement de ${user.tag}: ${error.message}`);
            }
            break;
    }
    
    // Envoyer un log
    sendLog(client, guild, user, reason, type, punishment);
}

/**
 * Envoie un log d'automodération
 * @param {Discord.Client} client - Le client Discord
 * @param {Discord.Guild} guild - Le serveur
 * @param {Discord.User} user - L'utilisateur sanctionné
 * @param {string} reason - La raison de la sanction
 * @param {string} type - Le type d'infraction (antilink, antispam, etc.)
 * @param {string} punishment - La sanction appliquée
 * @returns {Promise<void>}
 */
async function sendLog(client, guild, user, reason, type, punishment) {
    // Récupérer le salon de logs
    const logChannelId = automod.get(`logchannel_${guild.id}`);
    if (!logChannelId) return; // Pas de salon de logs configuré
    
    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return; // Le salon n'existe plus
    
    // Créer l'embed
    const embed = new Discord.MessageEmbed()
        .setTitle('Automodération')
        .setDescription(`Un utilisateur a été sanctionné par l'automodération.`)
        .addField('Utilisateur', `${user.tag} (${user.id})`, true)
        .addField('Type', type === "antilink" ? "Anti-Liens" : type === "antispam" ? "Anti-Spam" : type === "antiinsulte" ? "Anti-Insultes" : "Anti-Mentions", true)
        .addField('Sanction', punishment === "warn" ? "Avertissement" : punishment === "mute" ? "Mute (10 minutes)" : punishment === "kick" ? "Expulsion" : "Bannissement", true)
        .addField('Raison', reason)
        .setColor('#FF0000')
        .setTimestamp()
        .setFooter({ text: config.bot.footer });
    
    // Envoyer l'embed
    logChannel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = {
    applySanction,
    sendLog
};