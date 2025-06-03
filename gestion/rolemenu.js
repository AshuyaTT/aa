const Discord = require("discord.js")
const db = require('quick.db')
const owner = new db.table("Owner")
const p3 = new db.table("Perm3")
const cl = new db.table("Color")
const rolemenu = new db.table("RoleMenu")
const config = require("../config")

module.exports = {
    name: 'rolemenu',
    usage: 'rolemenu',
    description: `Permet de créer un menu de rôles avancé avec des sélecteurs.`,
    async execute(client, message, args) {

        if (owner.get(`owners.${message.author.id}`) || config.bot.buyer.includes(message.author.id) || message.member.permissions.has("ADMINISTRATOR") || p3.get(`p3.${message.guild.id}.${message.author.id}`)) {

            let color = cl.fetch(`color_${message.guild.id}`)
            if (color == null) color = config.bot.couleur

            if (args[0] === "create") {
                const embed = new Discord.MessageEmbed()
                    .setTitle("Création d'un menu de rôles")
                    .setDescription(`Veuillez entrer un titre pour le menu de rôles.`)
                    .setColor(color)
                    .setFooter({ text: "Tapez 'annuler' pour annuler la création" });

                const msg = await message.channel.send({ embeds: [embed] });
                
                // Collecteur pour le titre
                const filter = m => m.author.id === message.author.id;
                const titleCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });
                
                titleCollector.on('collect', async titleMsg => {
                    if (titleMsg.content.toLowerCase() === 'annuler') {
                        message.channel.send("Création du menu de rôles annulée.");
                        return;
                    }
                    
                    const title = titleMsg.content;
                    
                    const descEmbed = new Discord.MessageEmbed()
                        .setTitle("Création d'un menu de rôles")
                        .setDescription(`Veuillez entrer une description pour le menu de rôles.`)
                        .setColor(color)
                        .setFooter({ text: "Tapez 'annuler' pour annuler la création" });
                    
                    await msg.edit({ embeds: [descEmbed] });
                    
                    // Collecteur pour la description
                    const descCollector = message.channel.createMessageCollector({ filter, time: 60000, max: 1 });
                    
                    descCollector.on('collect', async descMsg => {
                        if (descMsg.content.toLowerCase() === 'annuler') {
                            message.channel.send("Création du menu de rôles annulée.");
                            return;
                        }
                        
                        const description = descMsg.content;
                        
                        // Créer l'ID unique pour ce menu
                        const menuId = Date.now().toString();
                        
                        // Initialiser le menu de rôles dans la base de données
                        rolemenu.set(`menu_${menuId}`, {
                            title: title,
                            description: description,
                            guild: message.guild.id,
                            categories: []
                        });
                        
                        const roleEmbed = new Discord.MessageEmbed()
                            .setTitle("Création d'un menu de rôles")
                            .setDescription(`Menu de rôles créé avec succès! ID: \`${menuId}\`
                            
Pour ajouter une catégorie de rôles, utilisez la commande:
\`${config.bot.prefixe}rolemenu category add ${menuId} <nom>\`

Pour afficher le menu une fois configuré, utilisez:
\`${config.bot.prefixe}rolemenu show ${menuId}\``)
                            .setColor(color);
                        
                        await message.channel.send({ embeds: [roleEmbed] });
                    });
                });
                
            } else if (args[0] === "category") {
                if (args[1] === "add" && args[2] && args[3]) {
                    const menuId = args[2];
                    const categoryName = args.slice(3).join(' ');
                    
                    // Vérifier si le menu existe
                    const menu = rolemenu.get(`menu_${menuId}`);
                    if (!menu) {
                        return message.reply(`Le menu de rôles avec l'ID \`${menuId}\` n'existe pas.`);
                    }
                    
                    // Créer l'ID de la catégorie
                    const categoryId = `cat_${Date.now()}`;
                    
                    // Ajouter la catégorie au menu
                    const categories = menu.categories || [];
                    categories.push({
                        id: categoryId,
                        name: categoryName,
                        roles: []
                    });
                    
                    rolemenu.set(`menu_${menuId}.categories`, categories);
                    
                    const catEmbed = new Discord.MessageEmbed()
                        .setTitle("Menu de rôles")
                        .setDescription(`Catégorie \`${categoryName}\` ajoutée avec succès!
                        
Pour ajouter des rôles à cette catégorie, utilisez la commande:
\`${config.bot.prefixe}rolemenu role add ${menuId} ${categoryId} <@role> <description>\``)
                        .setColor(color);
                    
                    message.channel.send({ embeds: [catEmbed] });
                    
                } else if (args[1] === "remove" && args[2] && args[3]) {
                    const menuId = args[2];
                    const categoryId = args[3];
                    
                    // Vérifier si le menu existe
                    const menu = rolemenu.get(`menu_${menuId}`);
                    if (!menu) {
                        return message.reply(`Le menu de rôles avec l'ID \`${menuId}\` n'existe pas.`);
                    }
                    
                    // Supprimer la catégorie
                    const categories = menu.categories || [];
                    const newCategories = categories.filter(cat => cat.id !== categoryId);
                    
                    if (categories.length === newCategories.length) {
                        return message.reply(`La catégorie avec l'ID \`${categoryId}\` n'existe pas dans ce menu.`);
                    }
                    
                    rolemenu.set(`menu_${menuId}.categories`, newCategories);
                    
                    message.reply(`La catégorie a été supprimée avec succès du menu de rôles.`);
                }
                
            } else if (args[0] === "role") {
                if (args[1] === "add" && args[2] && args[3]) {
                    const menuId = args[2];
                    const categoryId = args[3];
                    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[4]);
                    
                    if (!role) {
                        return message.reply(`Veuillez mentionner un rôle valide ou fournir un ID de rôle valide.`);
                    }
                    
                    // Vérifier si le rôle a des permissions dangereuses
                    if (role.permissions.has("KICK_MEMBERS") || role.permissions.has("BAN_MEMBERS") || 
                        role.permissions.has("MANAGE_WEBHOOKS") || role.permissions.has("ADMINISTRATOR") || 
                        role.permissions.has("MANAGE_CHANNELS") || role.permissions.has("MANAGE_GUILD") || 
                        role.permissions.has("MENTION_EVERYONE") || role.permissions.has("MANAGE_ROLES")) {
                        return message.reply("Ce rôle a des permissions dangereuses et ne peut pas être ajouté à un menu de rôles.");
                    }
                    
                    const description = args.slice(5).join(' ') || "Aucune description";
                    
                    // Vérifier si le menu existe
                    const menu = rolemenu.get(`menu_${menuId}`);
                    if (!menu) {
                        return message.reply(`Le menu de rôles avec l'ID \`${menuId}\` n'existe pas.`);
                    }
                    
                    // Trouver la catégorie
                    const categories = menu.categories || [];
                    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
                    
                    if (categoryIndex === -1) {
                        return message.reply(`La catégorie avec l'ID \`${categoryId}\` n'existe pas dans ce menu.`);
                    }
                    
                    // Vérifier si le rôle est déjà dans cette catégorie
                    const category = categories[categoryIndex];
                    const roles = category.roles || [];
                    
                    if (roles.some(r => r.id === role.id)) {
                        return message.reply(`Ce rôle est déjà dans cette catégorie.`);
                    }
                    
                    // Ajouter le rôle à la catégorie
                    roles.push({
                        id: role.id,
                        description: description
                    });
                    
                    category.roles = roles;
                    categories[categoryIndex] = category;
                    rolemenu.set(`menu_${menuId}.categories`, categories);
                    
                    message.reply(`Le rôle ${role} a été ajouté avec succès à la catégorie.`);
                    
                } else if (args[1] === "remove" && args[2] && args[3] && args[4]) {
                    const menuId = args[2];
                    const categoryId = args[3];
                    const roleId = args[4];
                    
                    // Vérifier si le menu existe
                    const menu = rolemenu.get(`menu_${menuId}`);
                    if (!menu) {
                        return message.reply(`Le menu de rôles avec l'ID \`${menuId}\` n'existe pas.`);
                    }
                    
                    // Trouver la catégorie
                    const categories = menu.categories || [];
                    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
                    
                    if (categoryIndex === -1) {
                        return message.reply(`La catégorie avec l'ID \`${categoryId}\` n'existe pas dans ce menu.`);
                    }
                    
                    // Supprimer le rôle de la catégorie
                    const category = categories[categoryIndex];
                    const roles = category.roles || [];
                    const newRoles = roles.filter(r => r.id !== roleId);
                    
                    if (roles.length === newRoles.length) {
                        return message.reply(`Le rôle avec l'ID \`${roleId}\` n'existe pas dans cette catégorie.`);
                    }
                    
                    category.roles = newRoles;
                    categories[categoryIndex] = category;
                    rolemenu.set(`menu_${menuId}.categories`, categories);
                    
                    message.reply(`Le rôle a été supprimé avec succès de la catégorie.`);
                }
                
            } else if (args[0] === "show" && args[1]) {
                const menuId = args[1];
                
                // Vérifier si le menu existe
                const menu = rolemenu.get(`menu_${menuId}`);
                if (!menu) {
                    return message.reply(`Le menu de rôles avec l'ID \`${menuId}\` n'existe pas.`);
                }
                
                // Vérifier si le menu a des catégories
                const categories = menu.categories || [];
                if (categories.length === 0) {
                    return message.reply(`Ce menu de rôles n'a pas encore de catégories. Ajoutez-en avec \`${config.bot.prefixe}rolemenu category add ${menuId} <nom>\``);
                }
                
                // Créer l'embed
                const embed = new Discord.MessageEmbed()
                    .setTitle(menu.title)
                    .setDescription(menu.description)
                    .setColor(color)
                    .setFooter({ text: config.bot.footer });
                
                // Créer les composants de sélection pour chaque catégorie
                const components = [];
                
                for (const category of categories) {
                    if (!category.roles || category.roles.length === 0) continue;
                    
                    const selectMenu = new Discord.MessageSelectMenu()
                        .setCustomId(`rolemenu_${menuId}_${category.id}`)
                        .setPlaceholder(`Sélectionnez des rôles: ${category.name}`)
                        .setMinValues(0)
                        .setMaxValues(category.roles.length);
                    
                    for (const roleData of category.roles) {
                        const role = message.guild.roles.cache.get(roleData.id);
                        if (!role) continue;
                        
                        selectMenu.addOptions([
                            {
                                label: role.name,
                                description: roleData.description.substring(0, 100),
                                value: role.id
                            }
                        ]);
                    }
                    
                    if (selectMenu.options.length > 0) {
                        components.push(new Discord.MessageActionRow().addComponents(selectMenu));
                    }
                }
                
                if (components.length === 0) {
                    return message.reply(`Ce menu de rôles n'a pas de rôles valides configurés.`);
                }
                
                // Envoyer le message avec l'embed et les composants
                message.channel.send({ embeds: [embed], components: components });
                
            } else if (args[0] === "list") {
                // Récupérer tous les menus du serveur
                const allMenus = rolemenu.all();
                const serverMenus = allMenus.filter(entry => 
                    entry.ID.startsWith('menu_') && 
                    entry.data.guild === message.guild.id
                );
                
                if (serverMenus.length === 0) {
                    return message.reply(`Aucun menu de rôles n'a été créé sur ce serveur.`);
                }
                
                const embed = new Discord.MessageEmbed()
                    .setTitle("Menus de rôles")
                    .setDescription(`Liste des menus de rôles sur ce serveur:`)
                    .setColor(color)
                    .setFooter({ text: config.bot.footer });
                
                for (const menu of serverMenus) {
                    const menuData = menu.data;
                    const categoryCount = menuData.categories ? menuData.categories.length : 0;
                    let roleCount = 0;
                    
                    if (menuData.categories) {
                        for (const category of menuData.categories) {
                            roleCount += category.roles ? category.roles.length : 0;
                        }
                    }
                    
                    embed.addField(`${menuData.title}`, `ID: \`${menu.ID.replace('menu_', '')}\`\nCatégories: ${categoryCount}\nRôles: ${roleCount}`);
                }
                
                message.channel.send({ embeds: [embed] });
                
            } else if (args[0] === "delete" && args[1]) {
                const menuId = args[1];
                
                // Vérifier si le menu existe
                const menu = rolemenu.get(`menu_${menuId}`);
                if (!menu) {
                    return message.reply(`Le menu de rôles avec l'ID \`${menuId}\` n'existe pas.`);
                }
                
                // Supprimer le menu
                rolemenu.delete(`menu_${menuId}`);
                
                message.reply(`Le menu de rôles a été supprimé avec succès.`);
                
            } else {
                // Afficher l'aide
                const embed = new Discord.MessageEmbed()
                    .setTitle("Menu de rôles - Aide")
                    .setDescription(`Commandes disponibles:
                    
**\`${config.bot.prefixe}rolemenu create\`**
Crée un nouveau menu de rôles interactif.

**\`${config.bot.prefixe}rolemenu category add <menuId> <nom>\`**
Ajoute une catégorie au menu de rôles.

**\`${config.bot.prefixe}rolemenu category remove <menuId> <categoryId>\`**
Supprime une catégorie du menu de rôles.

**\`${config.bot.prefixe}rolemenu role add <menuId> <categoryId> <@role> [description]\`**
Ajoute un rôle à une catégorie du menu.

**\`${config.bot.prefixe}rolemenu role remove <menuId> <categoryId> <roleId>\`**
Supprime un rôle d'une catégorie du menu.

**\`${config.bot.prefixe}rolemenu show <menuId>\`**
Affiche le menu de rôles dans le salon actuel.

**\`${config.bot.prefixe}rolemenu list\`**
Affiche la liste des menus de rôles du serveur.

**\`${config.bot.prefixe}rolemenu delete <menuId>\`**
Supprime un menu de rôles.`)
                    .setColor(color)
                    .setFooter({ text: config.bot.footer });
                
                message.channel.send({ embeds: [embed] });
            }
        }
    }
};