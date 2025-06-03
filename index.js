const { Client, Intents, guild, Collection } = require('discord.js');
const Discord = require("discord.js")
const config = require('./config')
const ping = require('./ping.js')
const readdirSync = require("fs")
const db = require('quick.db')
const p = new db.table("Prefix")
const logembed = new db.table("embedlog")
ms = require("ms")
const color = config.bot.couleur
const inviteTracker = require('./invites/inviteTracker')
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING],
    restTimeOffset: 0,
    partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"]
});

// Chargement du token depuis les variables d'environnement
// SÉCURITÉ: Ne jamais inclure directement le token dans le code ou le committer dans Git
try {
    require('dotenv').config();
    client.login(process.env.DISCORD_TOKEN || process.env.token);
} catch (error) {
    console.error("Erreur lors de la connexion: Token invalide ou manquant");
    console.error("Veuillez configurer votre token en tant que variable d'environnement:");
    console.error("1. Pour le développement local: créez un fichier .env avec DISCORD_TOKEN=votre_token");
    console.error("2. Ajoutez .env à votre fichier .gitignore pour éviter de l'exposer");
    console.error("3. Pour la production: configurez la variable d'environnement via votre plateforme d'hébergement");
}
client.commands = new Collection();

// Initialisation du LogHandler
const LogHandler = require('./logs/LogHandler');
client.logHandler = new LogHandler(client);

// Initialisation du traceur d'invitation
inviteTracker.initInviteTracker(client).then(() => {
    console.log('Traceur d\'invitation initialisé avec succès');
}).catch(error => {
    console.error('Erreur lors de l\'initialisation du traceur d\'invitation:', error);
});

// Initialisation de DisTube pour le système de musique
const { DisTube } = require('distube');

// Plugins optionnels (peuvent ne pas être installés)
let SpotifyPlugin, SoundCloudPlugin, YtDlpPlugin;

// Tentative de chargement de SpotifyPlugin
try {
    SpotifyPlugin = require('@distube/spotify').SpotifyPlugin;
    console.log('Module @distube/spotify chargé avec succès');
} catch (e) {
    console.log('Module @distube/spotify non disponible, fonctionnalité Spotify désactivée');
    SpotifyPlugin = null;
}

// Tentative de chargement de SoundCloudPlugin
try {
    SoundCloudPlugin = require('@distube/soundcloud').SoundCloudPlugin;
    console.log('Module @distube/soundcloud chargé avec succès');
} catch (e) {
    console.log('Module @distube/soundcloud non disponible, fonctionnalité SoundCloud désactivée');
    SoundCloudPlugin = null;
}

// Tentative de chargement de YtDlpPlugin
try {
    YtDlpPlugin = require('@distube/yt-dlp').YtDlpPlugin;
    console.log('Module @distube/yt-dlp chargé avec succès');
} catch (e) {
    console.log('Module @distube/yt-dlp non disponible, fonctionnalité YouTube désactivée');
    YtDlpPlugin = null;
}

// Configuration des plugins
const plugins = [];

// Ajouter les plugins disponibles
if (SpotifyPlugin) {
    plugins.push(
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        })
    );
}

if (SoundCloudPlugin) {
    plugins.push(new SoundCloudPlugin());
}

if (YtDlpPlugin) {
    plugins.push(new YtDlpPlugin());
}

client.distube = new DisTube(client, {
    leaveOnStop: true,
    leaveOnFinish: false,
    leaveOnEmpty: true,
    emptyCooldown: 30,
    youtubeDL: false,
    plugins: plugins
});

// Événements DisTube
client.distube.on("playSong", (queue, song) => {
    const embed = new Discord.MessageEmbed()
        .setTitle("🎵 Lecture en cours")
        .setDescription(`**${song.name}** - \`${song.formattedDuration}\`\nDemandé par: ${song.user}`)
        .setThumbnail(song.thumbnail)
        .setColor(color)
        .setFooter({ text: config.bot.footer });
    queue.textChannel.send({ embeds: [embed] });
});

client.distube.on("addSong", (queue, song) => {
    const embed = new Discord.MessageEmbed()
        .setTitle("🎵 Musique ajoutée")
        .setDescription(`**${song.name}** - \`${song.formattedDuration}\`\nAjouté à la file d'attente par: ${song.user}`)
        .setThumbnail(song.thumbnail)
        .setColor(color)
        .setFooter({ text: config.bot.footer });
    queue.textChannel.send({ embeds: [embed] });
});

client.distube.on("error", (channel, error) => {
    console.error(error);
    if (channel) channel.send(`Une erreur est survenue: ${error.message}`);
});

const { GiveawaysManager } = require('discord-giveaways');
client.giveawaysManager = new GiveawaysManager(client, {
    storage: "./database.json",
    updateCountdownEvery: 3000,
    default: {
        botsCanWin: false,
        embedColor: "#FF0000",
        reaction: "🎉"
    }
});

//|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬| HANDLER |▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬|

// Remplacer presetlogs.js par logsystem.js dans le chargement des logs

const commandFiles = readdirSync('./moderation').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./moderation/${file}`);
    client.commands.set(command.name, command);
}


const parametreFiles = readdirSync('./parametre').filter(file => file.endsWith('.js'));
for (const file of parametreFiles) {
    const command = require(`./parametre/${file}`);
    client.commands.set(command.name, command);
}

const gestionFiles = readdirSync('./gestion').filter(file => file.endsWith('.js'));
for (const file of gestionFiles) {
    const command = require(`./gestion/${file}`);
    client.commands.set(command.name, command);
}

const utilitaireFiles = readdirSync('./utilitaire').filter(file => file.endsWith('.js'));
for (const file of utilitaireFiles) {
    const command = require(`./utilitaire/${file}`);
    client.commands.set(command.name, command);
}

const logsFiles = readdirSync('./logs').filter(file => file.endsWith('.js'));
for (const file of logsFiles) {
    const command = require(`./logs/${file}`);
    client.commands.set(command.name, command);
}

const antiraidFiles = readdirSync('./antiraid').filter(file => file.endsWith('.js'));
for (const file of antiraidFiles) {
    const command = require(`./antiraid/${file}`);
    client.commands.set(command.name, command);
}

const levelsFiles = readdirSync('./levels').filter(file => file.endsWith('.js'));
for (const file of levelsFiles) {
    const command = require(`./levels/${file}`);
    client.commands.set(command.name, command);
}

const countersFiles = readdirSync('./counters').filter(file => file.endsWith('.js'));
for (const file of countersFiles) {
    const command = require(`./counters/${file}`);
    client.commands.set(command.name, command);
}

const musicFiles = readdirSync('./music').filter(file => file.endsWith('.js'));
for (const file of musicFiles) {
    const command = require(`./music/${file}`);
    client.commands.set(command.name, command);
}

const automodFiles = readdirSync('./automod').filter(file => file.endsWith('.js') && file !== 'automodUtils.js');
for (const file of automodFiles) {
    const command = require(`./automod/${file}`);
    client.commands.set(command.name, command);
}

const profilesFiles = readdirSync('./profiles').filter(file => file.endsWith('.js'));
for (const file of profilesFiles) {
    const command = require(`./profiles/${file}`);
    client.commands.set(command.name, command);
}

const economyFiles = readdirSync('./economy').filter(file => file.endsWith('.js'));
for (const file of economyFiles) {
    const command = require(`./economy/${file}`);
    client.commands.set(command.name, command);
}

const invitesFiles = readdirSync('./invites').filter(file => file.endsWith('.js') && file !== 'inviteTracker.js');
for (const file of invitesFiles) {
    const command = require(`./invites/${file}`);
    client.commands.set(command.name, command);
}

const minigamesFiles = readdirSync('./minigames').filter(file => file.endsWith('.js'));
for (const file of minigamesFiles) {
    const command = require(`./minigames/${file}`);
    client.commands.set(command.name, command);
}

const statsFiles = readdirSync('./stats').filter(file => file.endsWith('.js'));
for (const file of statsFiles) {
    const command = require(`./stats/${file}`);
    client.commands.set(command.name, command);
}

const teamsFiles = readdirSync('./teams').filter(file => file.endsWith('.js'));
for (const file of teamsFiles) {
    const command = require(`./teams/${file}`);
    client.commands.set(command.name, command);
}

const captchaFiles = readdirSync('./captcha').filter(file => file.endsWith('.js') && file !== 'captchaUtils.js');
for (const file of captchaFiles) {
    const command = require(`./captcha/${file}`);
    client.commands.set(command.name, command);
}

const eventFiles = readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}

//|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬| ANTI-CRASH |▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬|

process.on("unhandledRejection", (reason, p) => {
    if (reason.code === 50007) return; // Cannot send messages to this user
    if (reason.code == 10062) return; // Unknown interaction
    if (reason.code == 10008) return; // Unknown message
    if (reason.code ==  50013) return; // Missing permissions
    console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
    console.log(err, origin);
});
process.on("multipleResolves", (type, promise, reason) => {
    console.log(type, promise, reason);
});
var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
client.on("warn", e => {
    console.log(e.replace(regToken, "[REDACTED]"));
});
client.on("error", e => {
    console.log(e.replace(regToken, "[REDACTED]"));
});

client.snipes = new Map()
client.on('messageDelete', function (message, channel) {

    client.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author,
        image: message.attachments.first() ? message.attachments.first().proxyURL : null
    })
})
