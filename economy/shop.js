const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'shop',
    usage: 'shop [buy/add/remove] [item] [prix]',
    description: `Permet de consulter la boutique du serveur et d'acheter des objets.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Récupérer le symbole de la monnaie
        let currency = economy.get(`currency_${message.guild.id}`) || "💰";

        // Si aucun argument n'est fourni, afficher la boutique
        if (!args[0]) {
            // Récupérer les objets de la boutique
            let shop = economy.get(`shop_${message.guild.id}`) || [];

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle(`Boutique de ${message.guild.name}`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Si la boutique est vide
            if (shop.length === 0) {
                embed.setDescription(`La boutique est vide. Un administrateur peut ajouter des objets avec \`${pf}shop add [item] [prix]\`.`);
            } else {
                // Ajouter chaque objet à l'embed
                let description = '';
                for (let i = 0; i < shop.length; i++) {
                    description += `**${i + 1}.** ${shop[i].name} - ${shop[i].price} ${currency}\n`;
                }
                embed.setDescription(description);
                embed.addField('Comment acheter', `Utilisez \`${pf}shop buy [numéro]\` pour acheter un objet.`);
            }

            // Envoyer l'embed
            return message.channel.send({ embeds: [embed] });
        }

        // Commande pour acheter un objet
        if (args[0].toLowerCase() === 'buy') {
            // Vérifier si un numéro d'objet a été spécifié
            if (!args[1]) {
                return message.reply(`Veuillez spécifier le numéro de l'objet que vous souhaitez acheter. Exemple : \`${pf}shop buy 1\``);
            }

            // Vérifier si le numéro est valide
            const itemNumber = parseInt(args[1]);
            if (isNaN(itemNumber) || itemNumber <= 0) {
                return message.reply(`Veuillez spécifier un numéro d'objet valide.`);
            }

            // Récupérer les objets de la boutique
            let shop = economy.get(`shop_${message.guild.id}`) || [];

            // Vérifier si l'objet existe
            if (itemNumber > shop.length) {
                return message.reply(`Cet objet n'existe pas. Utilisez \`${pf}shop\` pour voir la liste des objets disponibles.`);
            }

            // Récupérer l'objet
            const item = shop[itemNumber - 1];

            // Récupérer le solde de l'utilisateur
            let balance = economy.get(`balance_${message.guild.id}_${message.author.id}`) || 0;

            // Vérifier si l'utilisateur a assez d'argent
            if (balance < item.price) {
                return message.reply(`Vous n'avez pas assez d'argent pour acheter cet objet. Votre solde actuel est de **${balance} ${currency}**.`);
            }

            // Récupérer l'inventaire de l'utilisateur
            let inventory = economy.get(`inventory_${message.guild.id}_${message.author.id}`) || [];

            // Ajouter l'objet à l'inventaire
            inventory.push(item.name);
            economy.set(`inventory_${message.guild.id}_${message.author.id}`, inventory);

            // Soustraire le prix du solde
            economy.subtract(`balance_${message.guild.id}_${message.author.id}`, item.price);

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle('Achat effectué')
                .setDescription(`Vous avez acheté **${item.name}** pour **${item.price} ${currency}**.`)
                .addField('Votre nouveau solde', `${balance - item.price} ${currency}`, true)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Envoyer l'embed
            return message.channel.send({ embeds: [embed] });
        }

        // Commandes réservées aux administrateurs
        if (!message.member.permissions.has('ADMINISTRATOR') && !owner.get(`owners.${message.author.id}`) && config.bot.buyer !== message.author.id && message.guild.ownerId !== message.author.id) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        // Commande pour ajouter un objet
        if (args[0].toLowerCase() === 'add') {
            // Vérifier si un nom d'objet a été spécifié
            if (!args[1]) {
                return message.reply(`Veuillez spécifier le nom de l'objet que vous souhaitez ajouter. Exemple : \`${pf}shop add "Rôle VIP" 1000\``);
            }

            // Récupérer le nom de l'objet (peut contenir des espaces)
            let itemName = '';
            let priceIndex = 0;

            // Si le nom est entre guillemets
            if (args[1].startsWith('"')) {
                let inQuotes = true;
                for (let i = 1; i < args.length; i++) {
                    if (inQuotes) {
                        if (args[i].endsWith('"')) {
                            itemName += args[i].slice(0, -1);
                            inQuotes = false;
                            priceIndex = i + 1;
                            break;
                        } else {
                            itemName += args[i] + ' ';
                        }
                    }
                }
                itemName = itemName.slice(1); // Enlever le premier guillemet
            } else {
                // Si le nom est un seul mot
                itemName = args[1];
                priceIndex = 2;
            }

            // Vérifier si un prix a été spécifié
            if (!args[priceIndex]) {
                return message.reply(`Veuillez spécifier le prix de l'objet. Exemple : \`${pf}shop add "Rôle VIP" 1000\``);
            }

            // Vérifier si le prix est un nombre valide
            const price = parseInt(args[priceIndex]);
            if (isNaN(price) || price <= 0) {
                return message.reply(`Veuillez spécifier un prix valide (supérieur à 0).`);
            }

            // Récupérer les objets de la boutique
            let shop = economy.get(`shop_${message.guild.id}`) || [];

            // Ajouter l'objet à la boutique
            shop.push({
                name: itemName,
                price: price
            });
            economy.set(`shop_${message.guild.id}`, shop);

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle('Objet ajouté')
                .setDescription(`L'objet **${itemName}** a été ajouté à la boutique pour **${price} ${currency}**.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Envoyer l'embed
            return message.channel.send({ embeds: [embed] });
        }

        // Commande pour supprimer un objet
        if (args[0].toLowerCase() === 'remove') {
            // Vérifier si un numéro d'objet a été spécifié
            if (!args[1]) {
                return message.reply(`Veuillez spécifier le numéro de l'objet que vous souhaitez supprimer. Exemple : \`${pf}shop remove 1\``);
            }

            // Vérifier si le numéro est valide
            const itemNumber = parseInt(args[1]);
            if (isNaN(itemNumber) || itemNumber <= 0) {
                return message.reply(`Veuillez spécifier un numéro d'objet valide.`);
            }

            // Récupérer les objets de la boutique
            let shop = economy.get(`shop_${message.guild.id}`) || [];

            // Vérifier si l'objet existe
            if (itemNumber > shop.length) {
                return message.reply(`Cet objet n'existe pas. Utilisez \`${pf}shop\` pour voir la liste des objets disponibles.`);
            }

            // Récupérer l'objet
            const item = shop[itemNumber - 1];

            // Supprimer l'objet de la boutique
            shop.splice(itemNumber - 1, 1);
            economy.set(`shop_${message.guild.id}`, shop);

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle('Objet supprimé')
                .setDescription(`L'objet **${item.name}** a été supprimé de la boutique.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Envoyer l'embed
            return message.channel.send({ embeds: [embed] });
        }

        // Si l'argument n'est pas reconnu
        return message.reply(`Commande non reconnue. Utilisez \`${pf}shop\`, \`${pf}shop buy [numéro]\`, \`${pf}shop add [item] [prix]\` ou \`${pf}shop remove [numéro]\`.`);
    }
};