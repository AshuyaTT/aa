const Discord = require('discord.js')
const db = require("quick.db")
const owner = new db.table("Owner")
const rlog = new db.table("raidlog")
const punish = new db.table("Punition")
const wl = new db.table("Whitelist")
const atr = new db.table("antirolecreate")
const config = require('../config')
const { updateCounter } = require('../counters/counterconfig')

module.exports = {
    name: 'roleCreate',
    once: false,

    async execute(client, role) {
        // Update role counter
        updateCounter(client, role.guild, "roleCounter");

        const audit = await role.guild.fetchAuditLogs({type: "ROLE_CREATE"}).then((audit) => audit.entries.first())
        if (!audit | !audit.executor) return
        if (audit.executor === client.user.id) return

        if (atr.fetch(`config.${role.guild.id}.antirolecreate`) == true) {

            if (owner.get(`owners.${audit.executor.id}`) || wl.get(`${role.guild.id}.${audit.executor.id}.wl`) || config.bot.buyer === audit.executor.id === true || client.user.id === audit.executor.id === true) return

            if (audit.action == 'ROLE_CREATE') {

                role.delete()

                if (punish.get(`sanction_${role.guild.id}`) === "ban") {
                    role.guild.members.ban(audit.executor.id, { reason: `Antirôle Create` })

                } else if (punish.get(`sanction_${role.guild.id}`) === "derank") {

                    role.guild.members.resolve(audit.executor).roles.cache.forEach(role => {
                        if (role.name !== '@everyone') {
                            role.guild.members.resolve(audit.executor).roles.remove(role).catch(() => false)
                        }
                    })

                } else if (punish.get(`sanction_${role.guild.id}`) === "kick") {

                    role.guild.members.kick(audit.executor.id, { reason: `Antirôle Create` })
                }
                const embed = new Discord.MessageEmbed()
                    .setDescription(`<@${audit.executor.id}> a tenté de \`créer\` un rôle, il a été sanctionné`)
                    .setTimestamp()
                const logchannel = client.channels.cache.get(rlog.fetch(`${role.guild.id}.raidlog`))
                if (logchannel) logchannel.send({ embeds: [embed] }).catch(() => false)

            }
        }
    }
}