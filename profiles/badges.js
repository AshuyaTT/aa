const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const owner = new db.table("Owner");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const profiles = new db.table("Profiles");

module.exports = {
    name: 'badges',
    usage: 'badges [add/remove] [utilisateur] [badge]',
    description: `Permet de gérer les badges des utilisateurs.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Vérifier les permissions
        if (!owner.get(`owners.${message.author.id}`) && config.bot.buyer !== message.author.id && message.guild.ownerId !== message.author.id && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        // Liste des badges disponibles
        const availableBadges = ['admin', 'mod', 'booster', 'dev', 'vip'];
        const badgeNames = {
            'admin': '👑 Administrateur',
            'mod': '🛡️ Modérateur',
            'booster': '🚀 Booster',
            'dev': '💻 Développeur',
            'vip': '⭐ VIP'
        };

        // Si aucun argument n'est fourni, afficher l'aide
        if (!args[0]) {
            const embed = new Discord.MessageEmbed()
                .setTitle('Gestion des badges')
                .setDescription(`Cette commande permet de gérer les badges des utilisateurs.`)
                .addField('Utilisation', `\`${pf}badges add @utilisateur badge\` - Ajouter un badge\n\`${pf}badges remove @utilisateur badge\` - Retirer un badge\n\`${pf}badges list @utilisateur\` - Lister les badges d'un utilisateur`)
                .addField('Badges disponibles', Object.entries(badgeNames).map(([id, name]) => `\`${id}\` - ${name}`).join('\n'))
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            return message.channel.send({ embeds: [embed] });
        }

        // Récupérer l'action (add, remove, list)
        const action = args[0].toLowerCase();
        if (!['add', 'remove', 'list'].includes(action)) {
            return message.reply(`Action invalide. Utilisez \`add\`, \`remove\` ou \`list\`.`);
        }

        // Récupérer l'utilisateur cible
        const target = message.mentions.users.first() || client.users.cache.get(args[1]);
        if (!target) {
            return message.reply(`Veuillez mentionner un utilisateur ou fournir son ID.`);
        }

        // Récupérer les badges actuels de l'utilisateur
        let userBadges = profiles.get(`badges_${message.guild.id}_${target.id}`) || [];

        // Action : list
        if (action === 'list') {
            if (userBadges.length === 0) {
                return message.reply(`${target.username} n'a aucun badge.`);
            }

            const embed = new Discord.MessageEmbed()
                .setTitle(`Badges de ${target.username}`)
                .setDescription(userBadges.map(badge => badgeNames[badge] || badge).join('\n'))
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            return message.channel.send({ embeds: [embed] });
        }

        // Pour les actions add et remove, on a besoin du badge
        if (!args[2]) {
            return message.reply(`Veuillez spécifier un badge. Badges disponibles : ${availableBadges.join(', ')}`);
        }

        const badge = args[2].toLowerCase();
        if (!availableBadges.includes(badge)) {
            return message.reply(`Badge invalide. Badges disponibles : ${availableBadges.join(', ')}`);
        }

        // Action : add
        if (action === 'add') {
            if (userBadges.includes(badge)) {
                return message.reply(`${target.username} possède déjà ce badge.`);
            }

            userBadges.push(badge);
            profiles.set(`badges_${message.guild.id}_${target.id}`, userBadges);

            const embed = new Discord.MessageEmbed()
                .setTitle('Badge ajouté')
                .setDescription(`Le badge ${badgeNames[badge]} a été ajouté à ${target.username}.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            return message.channel.send({ embeds: [embed] });
        }

        // Action : remove
        if (action === 'remove') {
            if (!userBadges.includes(badge)) {
                return message.reply(`${target.username} ne possède pas ce badge.`);
            }

            userBadges = userBadges.filter(b => b !== badge);
            profiles.set(`badges_${message.guild.id}_${target.id}`, userBadges);

            const embed = new Discord.MessageEmbed()
                .setTitle('Badge retiré')
                .setDescription(`Le badge ${badgeNames[badge]} a été retiré de ${target.username}.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });
            
            return message.channel.send({ embeds: [embed] });
        }
    }
};