const Discord = require("discord.js")
const db = require('quick.db')
const config = require("../config")
const modmail = new db.table("Modmail")
const cl = new db.table("Color")

module.exports = {
    name: 'close',
    usage: 'close [raison]',
    description: `Permet de fermer un ticket modmail.`,
    async execute(client, message, args) {

        let color = cl.fetch(`color_${message.guild.id}`)
        if (color == null) color = config.bot.couleur

        // Vérifier si le salon est un ticket modmail
        const userId = modmail.get(`modmail_channel_${message.channel.id}`);
        if (!userId) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Ce salon n'est pas un ticket ModMail.")
                        .setColor(color)
                ]
            });
        }

        // Récupérer l'utilisateur
        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("L'utilisateur associé à ce ticket n'a pas été trouvé. Le ticket sera fermé.")
                        .setColor(color)
                ]
            });
            
            // Fermer le ticket
            setTimeout(async () => {
                try {
                    await message.channel.delete(`Ticket ModMail fermé - Utilisateur introuvable`);
                    
                    // Trouver l'entrée du ticket dans la DB
                    const guildIds = client.guilds.cache.map(guild => guild.id);
                    for (const guildId of guildIds) {
                        if (modmail.get(`modmail_ticket_${guildId}_${userId}`)) {
                            modmail.delete(`modmail_ticket_${guildId}_${userId}`);
                            break;
                        }
                    }
                    
                    modmail.delete(`modmail_channel_${message.channel.id}`);
                } catch (error) {
                    console.error("Erreur lors de la fermeture du ticket ModMail:", error);
                }
            }, 5000);
            
            return;
        }

        // Récupérer la raison
        const reason = args.join(' ') || "Aucune raison spécifiée";

        // Informer l'utilisateur
        try {
            await user.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle("Ticket Fermé")
                        .setDescription(`Votre ticket ModMail a été fermé par un membre du staff.
                        
**Raison:** ${reason}

Merci d'avoir contacté le staff de **${message.guild.name}**. Si vous avez d'autres questions, n'hésitez pas à ouvrir un nouveau ticket.`)
                        .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                        .setFooter({ text: config.bot.footer })
                        .setTimestamp()
                ]
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi du message de fermeture à l'utilisateur:", error);
            message.channel.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setDescription("Je n'ai pas pu envoyer de message à l'utilisateur pour l'informer de la fermeture du ticket.")
                        .setColor(color)
                ]
            });
        }

        // Informer le staff
        await message.channel.send({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle("Ticket Fermé")
                    .setDescription(`Le ticket a été fermé par ${message.author}.
                    
**Raison:** ${reason}`)
                    .setColor(modmail.get(`modmail_color_${message.guild.id}`) || color)
                    .setFooter({ text: `Ticket fermé • ${new Date().toLocaleString()}` })
            ]
        });

        // Fermer le ticket après 5 secondes
        setTimeout(async () => {
            try {
                // Supprimer le salon du ticket
                await message.channel.delete(`Ticket ModMail fermé par ${message.author.tag} - ${reason}`);
                
                // Trouver l'entrée du ticket dans la DB
                const guildIds = client.guilds.cache.map(guild => guild.id);
                for (const guildId of guildIds) {
                    if (modmail.get(`modmail_ticket_${guildId}_${userId}`)) {
                        modmail.delete(`modmail_ticket_${guildId}_${userId}`);
                        break;
                    }
                }
                
                // Supprimer les entrées de la base de données
                modmail.delete(`modmail_channel_${message.channel.id}`);
            } catch (error) {
                console.error("Erreur lors de la fermeture du ticket ModMail:", error);
            }
        }, 5000);
    }
};