const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const levels = new db.table("Levels");
const footer = config.bot.footer;

module.exports = {
    name: 'levelconfig',
    usage: 'levelconfig',
    description: `Permet de configurer le système de niveaux.`,
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
                                label: "Activer les niveaux",
                                value: `activelevel`,
                                emoji: "✅",
                            },
                            {
                                label: 'Désactiver les niveaux',
                                value: `desactivelevel`,
                                emoji: "❌",
                            },
                            {
                                label: "Configurer le salon d'annonce",
                                value: "setlevelchannel",
                                emoji: "📢",
                            },
                            {
                                label: "Configurer le taux d'XP",
                                value: "setxprate",
                                emoji: "📊",
                            },
                            {
                                label: 'Annuler',
                                value: "Cancel",
                                emoji: '🔙',
                            },
                        ]);

                    let levelSettings = levels.get(`levelSettings_${message.guild.id}`);
                    if (levelSettings == null) levelSettings = "Non Configuré";
                    if (levelSettings === true) levelSettings = "Activé";
                    if (levelSettings === false) levelSettings = "Désactivé";

                    let levelChannel = `<#${levels.get(`levelChannel_${message.guild.id}`)}>`;
                    if (levelChannel === "<#null>") levelChannel = "Non Configuré";

                    let xpRate = levels.get(`xpRate_${message.guild.id}`);
                    if (xpRate == null) xpRate = 1;

                    const MenuEmbed = new Discord.MessageEmbed()
                        .setTitle('Configuration des Niveaux')
                        .setDescription(`__**Choisissez les options pour configurer le système de niveaux**__`)
                        .addFields(
                            { name: 'Statut', value: `Niveaux: __**${levelSettings}**__`, inline: true },
                            { name: "Salon d'annonce", value: `Salon: __**${levelChannel}**__`, inline: true },
                            { name: "Taux d'XP", value: `Multiplicateur: __**${xpRate}x**__`, inline: true },
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
                        else if (i.values[0] === "activelevel") {
                            await i.deferUpdate().catch(() => false);
                            levels.set(`levelSettings_${message.guild.id}`, true);
                            message.channel.send("✅ | Le système de niveaux a été activé.").then(msg => {
                                setTimeout(() => msg.delete(), 5000);
                            });
                        }
                        else if (i.values[0] === "desactivelevel") {
                            await i.deferUpdate().catch(() => false);
                            levels.set(`levelSettings_${message.guild.id}`, false);
                            message.channel.send("❌ | Le système de niveaux a été désactivé.").then(msg => {
                                setTimeout(() => msg.delete(), 5000);
                            });
                        }
                        else if (i.values[0] === "setlevelchannel") {
                            await i.deferUpdate().catch(() => false);
                            const msg = await message.channel.send("Veuillez mentionner le salon où les annonces de niveau seront envoyées (ou 'none' pour désactiver)");
                            
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
                                
                                if (response.content.toLowerCase() === 'none') {
                                    levels.delete(`levelChannel_${message.guild.id}`);
                                    message.channel.send("✅ | Les annonces de niveau ont été désactivées.").then(msg => {
                                        setTimeout(() => msg.delete(), 5000);
                                    });
                                } else {
                                    const channel = response.mentions.channels.first();
                                    if (!channel) {
                                        return message.channel.send("❌ | Veuillez mentionner un salon valide.").then(msg => {
                                            setTimeout(() => msg.delete(), 5000);
                                        });
                                    }
                                    
                                    levels.set(`levelChannel_${message.guild.id}`, channel.id);
                                    message.channel.send(`✅ | Le salon d'annonce de niveau a été défini sur ${channel}.`).then(msg => {
                                        setTimeout(() => msg.delete(), 5000);
                                    });
                                }
                            }
                        }
                        else if (i.values[0] === "setxprate") {
                            await i.deferUpdate().catch(() => false);
                            const msg = await message.channel.send("Veuillez entrer le taux d'XP (1-5, où 1 est normal et 5 est 5x plus rapide)");
                            
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
                                
                                const rate = parseInt(response.content);
                                if (isNaN(rate) || rate < 1 || rate > 5) {
                                    return message.channel.send("❌ | Veuillez entrer un nombre entre 1 et 5.").then(msg => {
                                        setTimeout(() => msg.delete(), 5000);
                                    });
                                }
                                
                                levels.set(`xpRate_${message.guild.id}`, rate);
                                message.channel.send(`✅ | Le taux d'XP a été défini sur ${rate}x.`).then(msg => {
                                    setTimeout(() => msg.delete(), 5000);
                                });
                            }
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