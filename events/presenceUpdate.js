const db = require("quick.db")
const { updateCounter } = require('../counters/counterconfig')

module.exports = {
    name: 'presenceUpdate',
    once: false,

    async execute(client, oldPresence, newPresence) {

        const member = newPresence.member
        if (!member) return
        
        // Update online counter if status changed between online and offline
        const oldStatus = oldPresence?.status;
        const newStatus = newPresence?.status;
        
        // If status changed to or from offline, update the online counter
        if (oldStatus !== newStatus && (oldStatus === 'offline' || newStatus === 'offline')) {
            updateCounter(client, member.guild, "onlineCounter");
        }
        const link = db.fetch("support" + member.guild.id)
        if (link === null) return;
        if (link === true) {
            const roleID = await db.fetch("role" + member.guild.id)
            const inviteLink = await db.fetch("status" + member.guild.id)
            if (member.roles.cache.find(role => role.id === roleID)) {
                if (member.presence.activities.some(activity => activity.type === "CUSTOM" && activity.state && activity.state.includes(inviteLink))) return;
                if (!member.presence.activities.some(activity => activity.type === "CUSTOM" && activity.state && activity.state.includes(inviteLink))) {
                    await member.roles.remove(roleID, "Soutien");
                }
            } if (!member.roles.cache.find(role => role.id === roleID) && member.presence.activities.some(activity => activity.type === "CUSTOM" && activity.state && activity.state.includes(inviteLink))) {
                await member.roles.add(roleID, "Soutien");
            }
        }
    }
}
