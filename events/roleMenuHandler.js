const Discord = require('discord.js')
const db = require("quick.db")
const config = require('../config')
const rolemenu = new db.table("RoleMenu")
const cl = new db.table("Color")

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute(client, interaction) {
        // Vérifier si c'est une interaction de sélection
        if (!interaction.isSelectMenu()) return;
        
        // Vérifier si c'est une interaction pour un menu de rôles
        if (!interaction.customId.startsWith('rolemenu_')) return;
        
        // Extraire les informations de l'ID personnalisé
        const [, menuId, categoryId] = interaction.customId.split('_');
        
        // Récupérer le menu
        const menu = rolemenu.get(`menu_${menuId}`);
        if (!menu) {
            return interaction.reply({ 
                content: "Ce menu de rôles n'existe plus.", 
                ephemeral: true 
            });
        }
        
        // Trouver la catégorie
        const category = menu.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return interaction.reply({ 
                content: "Cette catégorie n'existe plus.", 
                ephemeral: true 
            });
        }
        
        // Récupérer les rôles de cette catégorie
        const categoryRoles = category.roles.map(r => r.id);
        
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Traiter les valeurs sélectionnées
            const selectedRoles = interaction.values;
            
            // Déterminer les rôles à ajouter et à retirer
            const rolesToAdd = selectedRoles;
            const rolesToRemove = categoryRoles.filter(roleId => !selectedRoles.includes(roleId));
            
            // Récupérer le membre
            const member = interaction.member;
            
            // Variable pour suivre les modifications
            let addedRoles = [];
            let removedRoles = [];
            
            // Ajouter les rôles
            for (const roleId of rolesToAdd) {
                if (!categoryRoles.includes(roleId)) continue; // Vérification de sécurité
                
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) continue;
                
                if (!member.roles.cache.has(roleId)) {
                    try {
                        await member.roles.add(role, "Menu de rôles");
                        addedRoles.push(role.name);
                    } catch (error) {
                        console.error(`Erreur lors de l'ajout du rôle ${role.name} à ${member.user.tag}:`, error);
                    }
                }
            }
            
            // Retirer les rôles
            for (const roleId of rolesToRemove) {
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) continue;
                
                if (member.roles.cache.has(roleId)) {
                    try {
                        await member.roles.remove(role, "Menu de rôles");
                        removedRoles.push(role.name);
                    } catch (error) {
                        console.error(`Erreur lors du retrait du rôle ${role.name} de ${member.user.tag}:`, error);
                    }
                }
            }
            
            // Construire le message de confirmation
            let replyMessage = "";
            
            if (addedRoles.length > 0) {
                replyMessage += `✅ Rôles ajoutés: ${addedRoles.join(", ")}\n`;
            }
            
            if (removedRoles.length > 0) {
                replyMessage += `❌ Rôles retirés: ${removedRoles.join(", ")}\n`;
            }
            
            if (replyMessage === "") {
                replyMessage = "Aucun changement n'a été effectué.";
            }
            
            // Envoyer la confirmation
            await interaction.editReply({
                content: replyMessage,
                ephemeral: true
            });
            
            // Log les modifications si un salon de log est configuré
            const logChannelId = rolemenu.get(`rolemenu_logs_${interaction.guild.id}`);
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new Discord.MessageEmbed()
                        .setTitle("Menu de rôles - Modification")
                        .setDescription(`**Utilisateur:** ${member.user.tag} (${member.id})
**Menu:** ${menu.title} (${menuId})
**Catégorie:** ${category.name}`)
                        .setColor(cl.fetch(`color_${interaction.guild.id}`) || config.bot.couleur)
                        .setTimestamp();
                    
                    if (addedRoles.length > 0) {
                        logEmbed.addField("Rôles ajoutés", addedRoles.join(", "));
                    }
                    
                    if (removedRoles.length > 0) {
                        logEmbed.addField("Rôles retirés", removedRoles.join(", "));
                    }
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(console.error);
                }
            }
            
        } catch (error) {
            console.error("Erreur lors du traitement du menu de rôles:", error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: "Une erreur s'est produite lors du traitement de votre sélection.",
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: "Une erreur s'est produite lors du traitement de votre sélection.",
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error("Erreur lors de la réponse à l'interaction:", replyError);
            }
        }
    }
};