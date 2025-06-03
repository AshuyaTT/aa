const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const automod = new db.table("Automod");
const { applySanction } = require('../automod/automodUtils');

// Regex pour détecter les liens
const linkRegex = /(https?:\/\/[^\s]+)/gi;

// Liste de mots interdits (insultes)
const forbiddenWords = [
    'connard', 'connasse', 'pute', 'salope', 'enculé', 'fdp', 'fils de pute', 'ta gueule', 'tg',
    'ntm', 'nique ta mère', 'bâtard', 'batard', 'putain', 'merde', 'con', 'conne', 'bite', 'couille',
    'pd', 'pédé', 'negro', 'négro', 'nègre', 'nigger', 'nigga', 'pute', 'salope', 'suce', 'sucer'
];

// Map pour stocker les derniers messages des utilisateurs (pour la détection de spam)
const userMessages = new Map();

// Map pour stocker le nombre de mentions par utilisateur
const userMentions = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        // Ignorer les messages des bots et les messages en DM
        if (message.author.bot || !message.guild) return;
        
        // Ignorer les messages des modérateurs
        if (message.member.permissions.has('MANAGE_MESSAGES')) return;
        
        // Vérifier si l'automodération est activée pour ce serveur
        const antilink = automod.get(`antilink_${message.guild.id}`);
        const antispam = automod.get(`antispam_${message.guild.id}`);
        const antiinsulte = automod.get(`antiinsulte_${message.guild.id}`);
        const antimention = automod.get(`antimention_${message.guild.id}`);
        
        // Si aucune fonctionnalité n'est activée, ne rien faire
        if (!antilink && !antispam && !antiinsulte && !antimention) return;
        
        // Anti-liens
        if (antilink && linkRegex.test(message.content)) {
            try {
                await message.delete();
                applySanction(client, message.guild, message.author, "Message contenant un lien non autorisé", "antilink");
            } catch (error) {
                console.error(`Erreur lors de la suppression d'un message contenant un lien: ${error.message}`);
            }
            return;
        }
        
        // Anti-insultes
        if (antiinsulte) {
            const content = message.content.toLowerCase();
            for (const word of forbiddenWords) {
                if (content.includes(word)) {
                    try {
                        await message.delete();
                        applySanction(client, message.guild, message.author, "Message contenant une insulte", "antiinsulte");
                    } catch (error) {
                        console.error(`Erreur lors de la suppression d'un message contenant une insulte: ${error.message}`);
                    }
                    return;
                }
            }
        }
        
        // Anti-spam
        if (antispam) {
            const userId = message.author.id;
            const guildId = message.guild.id;
            const key = `${guildId}-${userId}`;
            
            if (!userMessages.has(key)) {
                userMessages.set(key, {
                    messages: [message.content],
                    timestamp: Date.now()
                });
            } else {
                const userData = userMessages.get(key);
                userData.messages.push(message.content);
                
                // Vérifier si l'utilisateur a envoyé plus de 5 messages en moins de 5 secondes
                if (userData.messages.length >= 5 && Date.now() - userData.timestamp < 5000) {
                    try {
                        // Supprimer les 5 derniers messages de l'utilisateur
                        const messages = await message.channel.messages.fetch({ limit: 10 });
                        const userMessages = messages.filter(m => m.author.id === userId);
                        const messagesToDelete = userMessages.first(5);
                        
                        if (messagesToDelete.length > 0) {
                            await message.channel.bulkDelete(messagesToDelete);
                        }
                        
                        applySanction(client, message.guild, message.author, "Spam détecté", "antispam");
                    } catch (error) {
                        console.error(`Erreur lors de la suppression de messages de spam: ${error.message}`);
                    }
                    
                    // Réinitialiser les données de l'utilisateur
                    userMessages.delete(key);
                    return;
                }
                
                // Si plus de 10 secondes se sont écoulées, réinitialiser les données
                if (Date.now() - userData.timestamp > 10000) {
                    userData.messages = [message.content];
                    userData.timestamp = Date.now();
                }
            }
        }
        
        // Anti-mentions
        if (antimention && message.mentions.users.size > 0) {
            const userId = message.author.id;
            const guildId = message.guild.id;
            const key = `${guildId}-${userId}`;
            
            if (!userMentions.has(key)) {
                userMentions.set(key, {
                    count: message.mentions.users.size,
                    timestamp: Date.now()
                });
            } else {
                const userData = userMentions.get(key);
                userData.count += message.mentions.users.size;
                
                // Vérifier si l'utilisateur a mentionné plus de 5 personnes en moins de 10 secondes
                if (userData.count >= 5 && Date.now() - userData.timestamp < 10000) {
                    try {
                        await message.delete();
                        applySanction(client, message.guild, message.author, "Trop de mentions en peu de temps", "antimention");
                    } catch (error) {
                        console.error(`Erreur lors de la suppression d'un message contenant trop de mentions: ${error.message}`);
                    }
                    
                    // Réinitialiser les données de l'utilisateur
                    userMentions.delete(key);
                    return;
                }
                
                // Si plus de 20 secondes se sont écoulées, réinitialiser les données
                if (Date.now() - userData.timestamp > 20000) {
                    userData.count = message.mentions.users.size;
                    userData.timestamp = Date.now();
                }
            }
        }
    }
};