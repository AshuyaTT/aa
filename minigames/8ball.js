const Discord = require('discord.js');
const config = require("../config");

module.exports = {
    name: '8ball',
    aliases: ['8b', 'magic8ball'],
    description: 'Pose une question à la boule magique',
    usage: '[question]',
    run: async (client, message, args) => {
        // Vérifier si une question a été posée
        if (!args.length) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor(config.color)
                        .setDescription(`❌ Veuillez poser une question.\nExemple: \`${config.prefix}8ball Vais-je gagner à la loterie?\``)
                ]
            });
        }

        // Récupérer la question
        const question = args.join(' ');
        
        // Liste des réponses possibles
        const responses = [
            // Réponses positives
            "C'est certain.",
            "C'est décidément ainsi.",
            "Sans aucun doute.",
            "Oui, définitivement.",
            "Vous pouvez compter dessus.",
            "Très probablement.",
            "Les perspectives sont bonnes.",
            "Oui.",
            "Les signes indiquent que oui.",
            
            // Réponses neutres
            "Réponse floue, essayez à nouveau.",
            "Redemandez plus tard.",
            "Mieux vaut ne pas vous le dire maintenant.",
            "Impossible de prédire maintenant.",
            "Concentrez-vous et redemandez.",
            
            // Réponses négatives
            "N'y comptez pas.",
            "Ma réponse est non.",
            "Mes sources disent non.",
            "Les perspectives ne sont pas si bonnes.",
            "Très douteux."
        ];
        
        // Sélectionner une réponse aléatoire
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Déterminer la couleur en fonction du type de réponse
        let color = config.color;
        if (responses.indexOf(response) < 9) {
            color = '#43B581'; // Vert pour les réponses positives
        } else if (responses.indexOf(response) < 14) {
            color = '#FAA61A'; // Orange pour les réponses neutres
        } else {
            color = '#F04747'; // Rouge pour les réponses négatives
        }
        
        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor({ name: `${message.author.username} consulte la boule magique`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .addField('Question', question)
            .addField('Réponse', response)
            .setThumbnail('https://i.imgur.com/XhXbl3v.png') // Image d'une boule magique
            .setFooter({ text: config.footer })
            .setTimestamp();
        
        // Envoyer un message initial
        const msg = await message.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setColor(config.color)
                    .setAuthor({ name: `${message.author.username} consulte la boule magique`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
                    .setDescription('La boule magique réfléchit...')
                    .setThumbnail('https://i.imgur.com/XhXbl3v.png')
            ]
        });
        
        // Attendre 2 secondes pour l'effet dramatique
        setTimeout(() => {
            // Mettre à jour le message avec la réponse
            msg.edit({ embeds: [embed] });
        }, 2000);
    }
};