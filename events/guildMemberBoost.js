const db = require("quick.db")
const boostlog = new db.table("boostlog")
const { updateCounter } = require('../counters/counterconfig')

module.exports = {
    name: 'guildMemberUpdate',
    once: false,

    async execute(client, oldMember, newMember) {

        // Check if the member's boost status has changed
        if (oldMember.premiumSince === newMember.premiumSince) return
        
        // Update boost counter
        updateCounter(client, newMember.guild, "boostCounter");

        const chan = `${boostlog.fetch(`${newMember.guild.id}.boostlog`)}`
        if (!chan) return

        const channel = oldMember.guild.channels.cache.get(chan)
        if (channel) return channel.send({ content: `${oldMember.user.tag} vient de boost le serveur !` }).catch(() => false)

    }
}