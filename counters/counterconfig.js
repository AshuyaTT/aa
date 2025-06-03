const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const counters = new db.table("Counters");
const footer = config.bot.footer;

module.exports = {
    name: 'counterconfig',
    usage: 'counterconfig',
    description: `Permet de configurer les compteurs du serveur.`,
    async execute(client, message, args) {

        if (owner.get(`owners.${message.author.id}`) || config.bot.buyer.includes(message.author.id) === true) {

            let color = cl.fetch(`color_${message.guild.id}`);
            if (color == null) color = config.bot.couleur;

            let pf = p.fetch(`prefix_${message.guild.id}`);
            if (pf == null) pf = config.bot.prefixe;

            try {
                first_layer();
                async function first_layer() {
                    let menuoptions = new Discord.MessageSelectMenu()
                        .setCustomId('MenuSelection')
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder("Choisis une option")
                        .addOptions([
                            {
                                label: "Compteur de membres",
                                value: `membercounter`,
                                emoji: "👥",
                            },
                            {
                                label: 'Compteur de bots',
                                value: `botcounter`,
                                emoji: "🤖",
                            },
                            {
                                label: "Compteur de salons",
                                value: "channelcounter",
                                emoji: "📁",
                            },
                            {
                                label: "Compteur de rôles",
                                value: "rolecounter",
                                emoji: "🏷️",
                            },
                            {
                                label: "Compteur de boosts",
                                value: "boostcounter",
                                emoji: "🚀",
                            },
                            {
                                label: "Compteur en ligne",
                                value: "onlinecounter",
                                emoji: "🟢",
                            },
                            {
                                label: 'Désactiver un compteur',
                                value: "disablecounter",
                                emoji: "❌",
                            },
                            {
                                label: 'Annuler',
                                value: "Cancel",
                                emoji: '🔙',
                            },
                        ]);

                    // Get current counter settings
                    const memberCounter = counters.get(`memberCounter_${message.guild.id}`);
                    const botCounter = counters.get(`botCounter_${message.guild.id}`);
                    const channelCounter = counters.get(`channelCounter_${message.guild.id}`);
                    const roleCounter = counters.get(`roleCounter_${message.guild.id}`);
                    const boostCounter = counters.get(`boostCounter_${message.guild.id}`);
                    const onlineCounter = counters.get(`onlineCounter_${message.guild.id}`);

                    // Format channel mentions or "Non configuré"
                    const formatChannel = (channelId) => {
                        return channelId ? `<#${channelId}>` : "Non configuré";
                    };

                    const MenuEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration des Compteurs')
                        .setDescription(`__**Choisissez les options pour configurer les compteurs du serveur**__`)
                        .addFields(
                            { name: 'Compteur de membres', value: `Salon: __**${formatChannel(memberCounter)}**__`, inline: true },
                            { name: 'Compteur de bots', value: `Salon: __**${formatChannel(botCounter)}**__`, inline: true },
                            { name: 'Compteur de salons', value: `Salon: __**${formatChannel(channelCounter)}**__`, inline: true },
                            { name: 'Compteur de rôles', value: `Salon: __**${formatChannel(roleCounter)}**__`, inline: true },
                            { name: 'Compteur de boosts', value: `Salon: __**${formatChannel(boostCounter)}**__`, inline: true },
                            { name: 'Compteur en ligne', value: `Salon: __**${formatChannel(onlineCounter)}**__`, inline: true },
                        )
                        .setColor(color)
                        .setFooter({ text: `Si vous avez fait des modifications refaite la commande pour actualiser ce message.` });

                    const menumsg = await message.channel.send({ embeds: [MenuEmbed], components: [new Discord.MessageActionRow().addComponents([menuoptions])] });

                    let filter1 = (i) => i.user.id === message.author.id;
                    const collector = await menumsg.createMessageComponentCollector({
                        filter: filter1,
                        componentType: "SELECT_MENU"
                    });

                    collector.on("collect", async (i) => {
                        if (i.values[0] === "Cancel") {
                            menumsg.delete();
                        }
                        else if (i.values[0] === "membercounter" || i.values[0] === "botcounter" || 
                                i.values[0] === "channelcounter" || i.values[0] === "rolecounter" || 
                                i.values[0] === "boostcounter" || i.values[0] === "onlinecounter") {
                            
                            await i.deferUpdate().catch(() => false);
                            
                            // Map counter types to database keys and display names
                            const counterTypes = {
                                "membercounter": { dbKey: "memberCounter", name: "membres" },
                                "botcounter": { dbKey: "botCounter", name: "bots" },
                                "channelcounter": { dbKey: "channelCounter", name: "salons" },
                                "rolecounter": { dbKey: "roleCounter", name: "rôles" },
                                "boostcounter": { dbKey: "boostCounter", name: "boosts" },
                                "onlinecounter": { dbKey: "onlineCounter", name: "membres en ligne" }
                            };
                            
                            const counterType = counterTypes[i.values[0]];
                            
                            const msg = await message.channel.send(`Veuillez mentionner le salon qui sera utilisé comme compteur de ${counterType.name} (le salon sera renommé automatiquement)`);
                            
                            let filter2 = (m) => m.author.id === message.author.id;
                            const collected = await message.channel.awaitMessages({
                                filter: filter2,
                                max: 1,
                                time: 60000,
                                errors: ["time"]
                            }).catch(() => null);
                            
                            if (collected) {
                                const response = collected.first();
                                msg.delete().catch(() => false);
                                response.delete().catch(() => false);
                                
                                const channel = response.mentions.channels.first();
                                if (!channel) {
                                    return message.channel.send("❌ | Veuillez mentionner un salon valide.").then(msg => {
                                        setTimeout(() => msg.delete(), 5000);
                                    });
                                }
                                
                                // Check if channel is a voice channel
                                if (channel.type !== 'GUILD_VOICE') {
                                    return message.channel.send("❌ | Le salon doit être un salon vocal.").then(msg => {
                                        setTimeout(() => msg.delete(), 5000);
                                    });
                                }
                                
                                // Save counter configuration
                                counters.set(`${counterType.dbKey}_${message.guild.id}`, channel.id);
                                
                                // Update the channel name immediately
                                updateCounter(client, message.guild, counterType.dbKey);
                                
                                message.channel.send(`✅ | Le compteur de ${counterType.name} a été configuré sur ${channel}.`).then(msg => {
                                    setTimeout(() => msg.delete(), 5000);
                                });
                            }
                        }
                        else if (i.values[0] === "disablecounter") {
                            await i.deferUpdate().catch(() => false);
                            
                            let disableOptions = new Discord.MessageSelectMenu()
                                .setCustomId('DisableMenu')
                                .setMaxValues(1)
                                .setMinValues(1)
                                .setPlaceholder("Choisir un compteur à désactiver")
                                .addOptions([
                                    { label: "Compteur de membres", value: "memberCounter", emoji: "👥" },
                                    { label: "Compteur de bots", value: "botCounter", emoji: "🤖" },
                                    { label: "Compteur de salons", value: "channelCounter", emoji: "📁" },
                                    { label: "Compteur de rôles", value: "roleCounter", emoji: "🏷️" },
                                    { label: "Compteur de boosts", value: "boostCounter", emoji: "🚀" },
                                    { label: "Compteur en ligne", value: "onlineCounter", emoji: "🟢" },
                                    { label: "Retour", value: "back", emoji: "↩️" }
                                ]);
                            
                            const disableEmbed = new Discord.MessageEmbed()
                                .setTitle('Désactiver un compteur')
                                .setDescription("Sélectionnez le compteur que vous souhaitez désactiver")
                                .setColor(color);
                            
                            menumsg.edit({ embeds: [disableEmbed], components: [new Discord.MessageActionRow().addComponents([disableOptions])] });
                            
                            const disableCollector = await menumsg.createMessageComponentCollector({
                                filter: filter1,
                                componentType: "SELECT_MENU",
                                time: 60000
                            });
                            
                            disableCollector.on("collect", async (j) => {
                                if (j.values[0] === "back") {
                                    disableCollector.stop();
                                    first_layer();
                                    return;
                                }
                                
                                await j.deferUpdate().catch(() => false);
                                
                                // Map counter types to display names
                                const counterNames = {
                                    "memberCounter": "membres",
                                    "botCounter": "bots",
                                    "channelCounter": "salons",
                                    "roleCounter": "rôles",
                                    "boostCounter": "boosts",
                                    "onlineCounter": "membres en ligne"
                                };
                                
                                const counterKey = j.values[0];
                                const counterName = counterNames[counterKey];
                                
                                // Get the channel ID before deleting
                                const channelId = counters.get(`${counterKey}_${message.guild.id}`);
                                
                                if (!channelId) {
                                    message.channel.send(`❌ | Le compteur de ${counterName} n'est pas configuré.`).then(msg => {
                                        setTimeout(() => msg.delete(), 5000);
                                    });
                                    return;
                                }
                                
                                // Try to reset the channel name
                                try {
                                    const channel = message.guild.channels.cache.get(channelId);
                                    if (channel) {
                                        await channel.setName(`compteur-désactivé`).catch(() => {});
                                    }
                                } catch (error) {
                                    console.error("Error resetting channel name:", error);
                                }
                                
                                // Delete the counter from the database
                                counters.delete(`${counterKey}_${message.guild.id}`);
                                
                                message.channel.send(`✅ | Le compteur de ${counterName} a été désactivé.`).then(msg => {
                                    setTimeout(() => msg.delete(), 5000);
                                });
                            });
                        }
                    });
                }
            } catch (e) {
                console.log(e);
                return message.channel.send({
                    embeds: [new Discord.MessageEmbed()
                        .setColor(color)
                        .setTitle("Une erreur est survenue")
                        .setDescription("Une erreur inattendue s'est produite. Veuillez réessayer plus tard.")
                    ]
                });
            }
        }
    }
};

// Function to update a counter
async function updateCounter(client, guild, counterType) {
    const counters = new db.table("Counters");
    const channelId = counters.get(`${counterType}_${guild.id}`);
    
    if (!channelId) return;
    
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;
    
    try {
        let newName = "Compteur";
        
        switch (counterType) {
            case "memberCounter":
                newName = `👥・Membres: ${guild.memberCount}`;
                break;
            case "botCounter":
                const botCount = guild.members.cache.filter(member => member.user.bot).size;
                newName = `🤖・Bots: ${botCount}`;
                break;
            case "channelCounter":
                newName = `📁・Salons: ${guild.channels.cache.size}`;
                break;
            case "roleCounter":
                newName = `🏷️・Rôles: ${guild.roles.cache.size}`;
                break;
            case "boostCounter":
                newName = `🚀・Boosts: ${guild.premiumSubscriptionCount || 0}`;
                break;
            case "onlineCounter":
                const onlineCount = guild.members.cache.filter(member => 
                    member.presence?.status === "online" || 
                    member.presence?.status === "idle" || 
                    member.presence?.status === "dnd"
                ).size;
                newName = `🟢・En ligne: ${onlineCount}`;
                break;
        }
        
        await channel.setName(newName).catch(console.error);
    } catch (error) {
        console.error(`Error updating ${counterType}:`, error);
    }
}

// Export the updateCounter function so it can be used in event handlers
module.exports.updateCounter = updateCounter;