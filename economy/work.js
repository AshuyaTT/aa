const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'work',
    usage: 'work',
    description: `Permet de travailler pour gagner de l'argent.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Récupérer le symbole de la monnaie
        let currency = economy.get(`currency_${message.guild.id}`) || "💰";

        // Récupérer la dernière fois que l'utilisateur a travaillé
        let lastWork = economy.get(`lastwork_${message.guild.id}_${message.author.id}`) || 0;
        let cooldown = 30 * 60 * 1000; // 30 minutes en millisecondes
        let timeLeft = cooldown - (Date.now() - lastWork);

        // Vérifier si l'utilisateur peut travailler
        if (timeLeft > 0) {
            // Convertir le temps restant en minutes et secondes
            let minutes = Math.floor(timeLeft / (60 * 1000));
            let seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle('Travail')
                .setDescription(`Vous êtes fatigué(e) ! Vous pourrez travailler à nouveau dans **${minutes}m ${seconds}s**.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Envoyer l'embed
            return message.channel.send({ embeds: [embed] });
        }

        // Liste des emplois possibles avec leur salaire min et max
        const jobs = [
            { name: "Développeur", min: 100, max: 300, emoji: "💻" },
            { name: "Médecin", min: 150, max: 350, emoji: "👨‍⚕️" },
            { name: "Pompier", min: 120, max: 280, emoji: "👨‍🚒" },
            { name: "Policier", min: 130, max: 290, emoji: "👮" },
            { name: "Enseignant", min: 90, max: 250, emoji: "👨‍🏫" },
            { name: "Cuisinier", min: 80, max: 240, emoji: "👨‍🍳" },
            { name: "Artiste", min: 70, max: 350, emoji: "👨‍🎨" },
            { name: "Musicien", min: 60, max: 320, emoji: "🎵" },
            { name: "Agriculteur", min: 100, max: 260, emoji: "👨‍🌾" },
            { name: "Chauffeur", min: 90, max: 230, emoji: "🚗" },
            { name: "Livreur", min: 80, max: 220, emoji: "📦" },
            { name: "Serveur", min: 70, max: 210, emoji: "🍽️" },
            { name: "Vendeur", min: 80, max: 240, emoji: "🛒" },
            { name: "Mécanicien", min: 110, max: 270, emoji: "🔧" },
            { name: "Électricien", min: 120, max: 280, emoji: "⚡" }
        ];

        // Choisir un emploi aléatoire
        const job = jobs[Math.floor(Math.random() * jobs.length)];

        // Générer un salaire aléatoire entre le min et le max de l'emploi
        const amount = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

        // Récupérer le solde actuel de l'utilisateur
        let balance = economy.get(`balance_${message.guild.id}_${message.author.id}`) || 0;

        // Ajouter le salaire au solde
        economy.set(`balance_${message.guild.id}_${message.author.id}`, balance + amount);

        // Mettre à jour la dernière fois que l'utilisateur a travaillé
        economy.set(`lastwork_${message.guild.id}_${message.author.id}`, Date.now());

        // Liste des messages possibles
        const messages = [
            `Vous avez travaillé comme ${job.name} ${job.emoji} et avez gagné **${amount} ${currency}**!`,
            `Votre travail de ${job.name} ${job.emoji} vous a rapporté **${amount} ${currency}**!`,
            `Vous avez fait un excellent travail en tant que ${job.name} ${job.emoji} et avez reçu **${amount} ${currency}**!`,
            `Votre patron était satisfait de votre travail de ${job.name} ${job.emoji} et vous a donné **${amount} ${currency}**!`,
            `Vous avez passé quelques heures à travailler comme ${job.name} ${job.emoji} et avez gagné **${amount} ${currency}**!`
        ];

        // Choisir un message aléatoire
        const message_text = messages[Math.floor(Math.random() * messages.length)];

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle('Travail')
            .setDescription(message_text)
            .addField('Nouveau solde', `${balance + amount} ${currency}`, true)
            .setColor(color)
            .setFooter({ text: config.bot.footer });

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};