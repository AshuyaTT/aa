const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'inventory',
    aliases: ['inv'],
    usage: 'inventory [utilisateur]',
    description: `Permet de consulter son inventaire ou celui d'un autre utilisateur.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Déterminer l'utilisateur cible
        let target = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!target) target = message.author;

        // Récupérer l'inventaire de l'utilisateur
        let inventory = economy.get(`inventory_${message.guild.id}_${target.id}`) || [];

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle(`Inventaire de ${target.username}`)
            .setColor(color)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: config.bot.footer });

        // Si l'inventaire est vide
        if (inventory.length === 0) {
            embed.setDescription(`${target.id === message.author.id ? 'Vous n\'avez' : `${target.username} n'a`} aucun objet dans son inventaire.`);
            
            // Ajouter un conseil si c'est l'inventaire de l'utilisateur
            if (target.id === message.author.id) {
                embed.addField('Conseil', `Utilisez \`${pf}shop\` pour voir les objets disponibles à l'achat.`);
            }
        } else {
            // Compter les occurrences de chaque objet
            const itemCounts = {};
            for (const item of inventory) {
                itemCounts[item] = (itemCounts[item] || 0) + 1;
            }
            
            // Créer une liste formatée des objets
            let description = '';
            for (const [item, count] of Object.entries(itemCounts)) {
                description += `**${item}** x${count}\n`;
            }
            
            embed.setDescription(description);
        }

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};