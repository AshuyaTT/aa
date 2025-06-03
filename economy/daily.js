const Discord = require('discord.js');
const db = require('quick.db');
const config = require("../config");
const cl = new db.table("Color");
const p = new db.table("Prefix");
const economy = new db.table("Economy");

module.exports = {
    name: 'daily',
    usage: 'daily',
    description: `Permet de recevoir une récompense quotidienne.`,
    async execute(client, message, args) {
        let color = cl.fetch(`color_${message.guild.id}`);
        if (color == null) color = config.bot.couleur;

        let pf = p.fetch(`prefix_${message.guild.id}`);
        if (pf == null) pf = config.bot.prefixe;

        // Récupérer le symbole de la monnaie
        let currency = economy.get(`currency_${message.guild.id}`) || "💰";

        // Récupérer le montant de la récompense quotidienne
        let dailyAmount = economy.get(`dailyamount_${message.guild.id}`) || 200;

        // Récupérer la dernière fois que l'utilisateur a réclamé sa récompense
        let lastDaily = economy.get(`lastdaily_${message.guild.id}_${message.author.id}`) || 0;
        let cooldown = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
        let timeLeft = cooldown - (Date.now() - lastDaily);

        // Vérifier si l'utilisateur peut réclamer sa récompense
        if (timeLeft > 0) {
            // Convertir le temps restant en heures, minutes et secondes
            let hours = Math.floor(timeLeft / (60 * 60 * 1000));
            let minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            let seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

            // Créer l'embed
            const embed = new Discord.MessageEmbed()
                .setTitle('Récompense quotidienne')
                .setDescription(`Vous avez déjà réclamé votre récompense quotidienne. Vous pourrez la réclamer à nouveau dans **${hours}h ${minutes}m ${seconds}s**.`)
                .setColor(color)
                .setFooter({ text: config.bot.footer });

            // Envoyer l'embed
            return message.channel.send({ embeds: [embed] });
        }

        // Récupérer le solde actuel de l'utilisateur
        let balance = economy.get(`balance_${message.guild.id}_${message.author.id}`) || 0;

        // Ajouter la récompense au solde
        economy.set(`balance_${message.guild.id}_${message.author.id}`, balance + dailyAmount);

        // Mettre à jour la dernière fois que l'utilisateur a réclamé sa récompense
        economy.set(`lastdaily_${message.guild.id}_${message.author.id}`, Date.now());

        // Calculer le streak (jours consécutifs)
        let streak = economy.get(`streak_${message.guild.id}_${message.author.id}`) || 0;
        let lastDailyDate = new Date(lastDaily);
        let currentDate = new Date();
        
        // Vérifier si le dernier daily était hier
        if (lastDaily !== 0 && 
            lastDailyDate.getDate() === currentDate.getDate() - 1 && 
            lastDailyDate.getMonth() === currentDate.getMonth() && 
            lastDailyDate.getFullYear() === currentDate.getFullYear()) {
            // Incrémenter le streak
            streak++;
        } else if (lastDaily !== 0) {
            // Réinitialiser le streak
            streak = 1;
        } else {
            // Premier daily
            streak = 1;
        }
        
        // Enregistrer le nouveau streak
        economy.set(`streak_${message.guild.id}_${message.author.id}`, streak);
        
        // Bonus de streak (10% du montant quotidien par jour de streak, plafonné à 100%)
        let streakBonus = Math.min(streak * 0.1, 1) * dailyAmount;
        let totalAmount = dailyAmount + Math.floor(streakBonus);
        
        // Si c'est le premier jour, pas de bonus
        if (streak === 1) {
            streakBonus = 0;
            totalAmount = dailyAmount;
        }

        // Créer l'embed
        const embed = new Discord.MessageEmbed()
            .setTitle('Récompense quotidienne')
            .setDescription(`Vous avez réclamé votre récompense quotidienne de **${dailyAmount} ${currency}**!`)
            .addField('Streak', `${streak} jour${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''}`, true)
            .setColor(color)
            .setFooter({ text: config.bot.footer });

        // Ajouter le bonus de streak s'il y en a un
        if (streakBonus > 0) {
            embed.addField('Bonus de streak', `+${Math.floor(streakBonus)} ${currency}`, true);
            embed.addField('Total', `${totalAmount} ${currency}`, true);
            
            // Ajouter le bonus au solde
            economy.add(`balance_${message.guild.id}_${message.author.id}`, Math.floor(streakBonus));
        }

        // Envoyer l'embed
        message.channel.send({ embeds: [embed] });
    }
};