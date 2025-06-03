const { updateCounter } = require('../counters/counterconfig');
const db = require('quick.db');
const counters = new db.table("Counters");

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        // Update all counters when the bot starts
        updateAllCounters(client);
        
        // Set up an interval to update counters every 10 minutes
        setInterval(() => {
            updateAllCounters(client);
        }, 10 * 60 * 1000); // 10 minutes in milliseconds
    }
};

// Function to update all counters for all guilds
async function updateAllCounters(client) {
    // Get all guilds the bot is in
    client.guilds.cache.forEach(guild => {
        // Check and update each type of counter
        const counterTypes = [
            "memberCounter",
            "botCounter",
            "channelCounter",
            "roleCounter",
            "boostCounter",
            "onlineCounter"
        ];
        
        counterTypes.forEach(counterType => {
            // Check if this counter is configured for this guild
            if (counters.get(`${counterType}_${guild.id}`)) {
                // Update the counter
                updateCounter(client, guild, counterType);
            }
        });
    });
}