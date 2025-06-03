const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const profiles = new db.table("Profiles");

module.exports = {
    name: 'profile',
    usage: 'profile [utilisateur]',
    description: `Permet d'afficher le profil d'un utilisateur.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Déterminer l'utilisateur cible
        let target = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!target) target = message.author;

        // Récupérer les données du profil
        let bio = profiles.get(`bio_${message.guild.id}_${target.id}`) || "Aucune biographie définie.";
        let profileColor = profiles.get(`color_${message.guild.id}_${target.id}`) || color;
        let bannerUrl = profiles.get(`banner_${message.guild.id}_${target.id}`) || null;
        let badges = profiles.get(`badges_${message.guild.id}_${target.id}`) || [];
        let xp = db.get(`xp_${message.guild.id}_${target.id}`) || 0;
        let level = db.get(`level_${message.guild.id}_${target.id}`) || 0;
        let rep = profiles.get(`rep_${message.guild.id}_${target.id}`) || 0;

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Profil de ${target.username}`)
            .setDescription(bio)
            .addField('Niveau', `${level}`, true)
            .addField('XP', `${xp}/${100 * level}`, true)
            .addField('Réputation', `${rep} points`, true)
            .setColor(profileColor)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: config.bot.footer });

        // Ajouter la bannière si elle existe
        if (bannerUrl) {
            embed.setImage(bannerUrl);
        }

        // Ajouter les badges si l'utilisateur en a
        if (badges.length > 0) {
            let badgeText = '';
            for (const badge of badges) {
                switch (badge) {
                    case 'admin':
                        badgeText += '👑 Administrateur\n';
                        break;
                    case 'mod':
                        badgeText += '🛡️ Modérateur\n';
                        break;
                    case 'booster':
                        badgeText += '🚀 Booster\n';
                        break;
                    case 'dev':
                        badgeText += '💻 Développeur\n';
                        break;
                    case 'vip':
                        badgeText += '⭐ VIP\n';
                        break;
                    default:
                        badgeText += `${badge}\n`;
                }
            }
            embed.addField('Badges', badgeText, false);
        }

        // Ajouter les boutons pour les actions
        const row = new Discord.MessageActionRow().addComponents(
            new Discord.MessageButton()
                .setCustomId('rep_add')
                .setLabel('Donner un point de réputation')
                .setStyle('PRIMARY')
                .setEmoji('👍'),
            new Discord.MessageButton()
                .setCustomId('profile_help')
                .setLabel('Aide')
                .setStyle('SECONDARY')
                .setEmoji('❓')
        );

        // Envoyer l'embed
        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        // Créer le collecteur d'interactions
        const collector = msg.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'rep_add') {
                // Vérifier si l'utilisateur peut donner un point de réputation
                const lastRep = profiles.get(`lastrep_${message.guild.id}_${i.user.id}`) || 0;
                const now = Date.now();
                
                if (now - lastRep < 24 * 60 * 60 * 1000) {
                    // L'utilisateur a déjà donné un point de réputation dans les dernières 24 heures
                    const timeLeft = 24 * 60 * 60 * 1000 - (now - lastRep);
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    await i.reply({ content: `Vous avez déjà donné un point de réputation dans les dernières 24 heures. Vous pourrez en donner un autre dans ${hours}h ${minutes}m.`, ephemeral: true });
                } else if (i.user.id === target.id) {
                    // L'utilisateur ne peut pas se donner un point de réputation à lui-même
                    await i.reply({ content: `Vous ne pouvez pas vous donner un point de réputation à vous-même.`, ephemeral: true });
                } else {
                    // Donner un point de réputation
                    profiles.add(`rep_${message.guild.id}_${target.id}`, 1);
                    profiles.set(`lastrep_${message.guild.id}_${i.user.id}`, now);
                    rep += 1;
                    
                    // Mettre à jour l'embed
                    embed.fields[2].value = `${rep} points`;
                    await i.update({ embeds: [embed] });
                    
                    // Envoyer un message de confirmation
                    await i.followUp({ content: `Vous avez donné un point de réputation à ${target.username}.`, ephemeral: true });
                }
            } else if (i.customId === 'profile_help') {
                // Afficher l'aide
                const helpEmbed = new Discord.MessageEmbed()
                    .setTitle('Aide - Système de profil')
                    .setDescription('Voici les commandes disponibles pour personnaliser votre profil :')
                    .addField(`${pf}setbio [texte]`, 'Définir votre biographie')
                    .addField(`${pf}setcolor [couleur]`, 'Définir la couleur de votre profil')
                    .addField(`${pf}setbanner [url]`, 'Définir la bannière de votre profil')
                    .addField(`${pf}profile [utilisateur]`, 'Afficher le profil d\'un utilisateur')
                    .setColor(color)
                    .setFooter({ text: config.bot.footer });
                
                await i.reply({ embeds: [helpEmbed], ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (msg.editable) {
                msg.components = [];
                msg.edit({ components: [] }).catch(console.error);
            }
        });
    }
};