const Discord = require('discord.js');
const db = require('quick.db');
const invites = new db.table("Invites");

// Map pour stocker les invitations par serveur
const guildInvites = new Map();

/**
 * Initialise le traceur d'invitation pour un serveur
 * @param {Discord.Guild} guild - Le serveur
 * @returns {Promise<void>}
 */
async function initGuildInvites(guild) {
    try {
        // Récupérer toutes les invitations du serveur
        const fetchedInvites = await guild.invites.fetch();
        
        // Stocker les invitations dans la map
        guildInvites.set(guild.id, fetchedInvites);
    } catch (error) {
        console.error(`Erreur lors de l'initialisation des invitations pour ${guild.name}: ${error.message}`);
    }
}

/**
 * Initialise le traceur d'invitation pour tous les serveurs
 * @param {Discord.Client} client - Le client Discord
 * @returns {Promise<void>}
 */
async function initInviteTracker(client) {
    // Attendre que le client soit prêt
    if (!client.isReady()) {
        await new Promise(resolve => client.once('ready', resolve));
    }
    
    // Initialiser les invitations pour chaque serveur
    for (const guild of client.guilds.cache.values()) {
        await initGuildInvites(guild);
    }
    
    // Écouter les événements d'invitation
    client.on('inviteCreate', async invite => {
        // Mettre à jour la map des invitations
        const guildInviteList = guildInvites.get(invite.guild.id) || new Collection();
        guildInviteList.set(invite.code, invite);
        guildInvites.set(invite.guild.id, guildInviteList);
    });
    
    client.on('inviteDelete', async invite => {
        // Mettre à jour la map des invitations
        const guildInviteList = guildInvites.get(invite.guild.id);
        if (guildInviteList) {
            guildInviteList.delete(invite.code);
        }
    });
    
    // Écouter les événements de serveur
    client.on('guildCreate', async guild => {
        // Initialiser les invitations pour le nouveau serveur
        await initGuildInvites(guild);
    });
}

/**
 * Trouve l'inviteur d'un membre
 * @param {Discord.GuildMember} member - Le membre qui a rejoint
 * @returns {Promise<{inviter: Discord.User, code: string, uses: number}>}
 */
async function findInviter(member) {
    const { guild } = member;
    
    // Récupérer les anciennes invitations
    const oldInvites = guildInvites.get(guild.id) || new Discord.Collection();
    
    // Récupérer les nouvelles invitations
    const newInvites = await guild.invites.fetch();
    
    // Mettre à jour la map des invitations
    guildInvites.set(guild.id, newInvites);
    
    // Trouver l'invitation qui a été utilisée
    const usedInvite = newInvites.find(invite => {
        const oldInvite = oldInvites.get(invite.code);
        return oldInvite && invite.uses > oldInvite.uses;
    });
    
    // Si aucune invitation n'a été trouvée
    if (!usedInvite) {
        return null;
    }
    
    // Retourner l'inviteur et le code d'invitation
    return {
        inviter: usedInvite.inviter,
        code: usedInvite.code,
        uses: usedInvite.uses
    };
}

/**
 * Ajoute une invitation à un utilisateur
 * @param {string} guildId - L'ID du serveur
 * @param {string} userId - L'ID de l'utilisateur
 * @param {string} invitedId - L'ID de l'utilisateur invité
 * @returns {void}
 */
function addInvite(guildId, userId, invitedId) {
    // Récupérer les invitations de l'utilisateur
    let userInvites = invites.get(`invites_${guildId}_${userId}`) || [];
    
    // Ajouter l'invitation
    userInvites.push({
        invitedId: invitedId,
        timestamp: Date.now()
    });
    
    // Enregistrer les invitations
    invites.set(`invites_${guildId}_${userId}`, userInvites);
    
    // Incrémenter le compteur d'invitations
    invites.add(`inviteCount_${guildId}_${userId}`, 1);
}

/**
 * Récupère le nombre d'invitations d'un utilisateur
 * @param {string} guildId - L'ID du serveur
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {number}
 */
function getInviteCount(guildId, userId) {
    return invites.get(`inviteCount_${guildId}_${userId}`) || 0;
}

/**
 * Récupère les utilisateurs invités par un utilisateur
 * @param {string} guildId - L'ID du serveur
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Array<{invitedId: string, timestamp: number}>}
 */
function getInvitedUsers(guildId, userId) {
    return invites.get(`invites_${guildId}_${userId}`) || [];
}

/**
 * Récupère l'inviteur d'un utilisateur
 * @param {string} guildId - L'ID du serveur
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {string|null}
 */
function getInviter(guildId, userId) {
    return invites.get(`inviter_${guildId}_${userId}`);
}

/**
 * Définit l'inviteur d'un utilisateur
 * @param {string} guildId - L'ID du serveur
 * @param {string} userId - L'ID de l'utilisateur
 * @param {string} inviterId - L'ID de l'inviteur
 * @returns {void}
 */
function setInviter(guildId, userId, inviterId) {
    invites.set(`inviter_${guildId}_${userId}`, inviterId);
}

module.exports = {
    initInviteTracker,
    findInviter,
    addInvite,
    getInviteCount,
    getInvitedUsers,
    getInviter,
    setInviter
};