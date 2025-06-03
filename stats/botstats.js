const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const moment = require('moment');
const os = require('os');

module.exports = {
    name: 'botstats',
    aliases: ['botinfo', 'bot-stats', 'bot'],
    description: 'Affiche les statistiques du bot',
    run: async (client, message, args) => {
        // Statistiques de base
        const uptime = moment.duration(client.uptime).humanize();
        const ping = Math.round(client.ws.ping);
        
        // Statistiques des serveurs
        const serverCount = client.guilds.cache.size;
        const userCount = client.users.cache.size;
        const channelCount = client.channels.cache.size;
        
        // Statistiques des commandes
        const commandCount = client.commands.size;
        
        // Statistiques système
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const cpuCount = os.cpus().length;
        const cpuModel = os.cpus()[0].model;
        const cpuSpeed = (os.cpus()[0].speed / 1000).toFixed(2);
        const platform = os.platform();
        const arch = os.arch();
        
        // Statistiques de version
        const nodeVersion = process.version;
        const discordJsVersion = Discord.version;
        
        // Statistiques de création
        const createdAt = moment(client.user.createdAt).format('DD/MM/YYYY à HH:mm:ss');
        const createdAgo = moment.duration(Date.now() - client.user.createdAt).humanize();
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(config.color)
            .setTitle(`Statistiques de ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addField('📊 Informations générales', [
                `**ID:** ${client.user.id}`,
                `**Tag Discord:** ${client.user.tag}`,
                `**Créé le:** ${createdAt}`,
                `**Âge:** ${createdAgo}`,
                `**Uptime:** ${uptime}`,
                `**Ping:** ${ping}ms`
            ].join('\n'))
            .addField('🌐 Statistiques Discord', [
                `**Serveurs:** ${serverCount}`,
                `**Utilisateurs:** ${userCount}`,
                `**Salons:** ${channelCount}`,
                `**Commandes:** ${commandCount}`
            ].join('\n'), true)
            .addField('💻 Statistiques système', [
                `**Mémoire utilisée:** ${memoryUsage} MB`,
                `**Mémoire totale:** ${totalMemory} GB`,
                `**Mémoire libre:** ${freeMemory} GB`,
                `**CPU:** ${cpuModel}`,
                `**Cœurs CPU:** ${cpuCount}`,
                `**Vitesse CPU:** ${cpuSpeed} GHz`,
                `**Plateforme:** ${platform}`,
                `**Architecture:** ${arch}`
            ].join('\n'))
            .addField('🔧 Versions', [
                `**Node.js:** ${nodeVersion}`,
                `**Discord.js:** ${discordJsVersion}`
            ].join('\n'), true)
            .setFooter({ text: config.footer })
            .setTimestamp();
        
        // Ajouter les liens
        embed.addField('🔗 Liens', [
            `[Inviter le bot](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot)`,
            `[Serveur de support](https://discord.gg/support)`,
            `[GitHub](https://github.com/AshuyaTT/TurkishPrivaxx)`
        ].join('\n'), true);
        
        // Envoyer l'embed
        message.reply({ embeds: [embed] });
    }
};