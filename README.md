# TurkishPrivaxx - Bot Discord Multi-Fonctions

## 📋 Présentation

TurkishPrivaxx est un bot Discord complet offrant plus de 20 fonctionnalités pour une gestion optimale de votre serveur. Avec une seule commande (`+setupserver`), configurez automatiquement votre serveur avec tous les salons et rôles nécessaires.

### 🌟 Fonctionnalités principales

* **📊 Configuration automatique** - Créez tous les salons et rôles en un clic
* **📨 ModMail** - Système de tickets via messages privés
* **👑 Menu de rôles avancé** - Sélecteurs dropdown avec catégories
* **🛡️ Modération complète** - Commandes de gestion de serveur
* **🔒 Antiraid** - Protection contre les raids et attaques
* **🤖 Automodération** - Filtrage automatique des contenus inappropriés
* **📈 Système de niveaux** - Progression et récompenses
* **🔢 Compteurs dynamiques** - Statistiques de serveur en temps réel
* **👤 Profils personnalisés** - Badges, bannières et biographies
* **🎮 Mini-jeux** - Divertissement avec gains d'économie
* **💰 Système économique** - Monnaie virtuelle et boutique
* **🔗 Traceur d'invitations** - Suivi des invitations
* **👥 Système de Teams** - Création et gestion d'équipes
* **📋 Logs centralisés** - Suivi de toutes les activités
* **✅ Captcha** - Vérification des nouveaux membres
* **📊 Statistiques** - Données détaillées sur le serveur
* **🎁 Giveaways** - Organisation de concours
* **📝 Générateur d'embeds** - Création de messages enrichis
* **🎵 Système de musique** - Lecture depuis YouTube, Spotify et SoundCloud

## 📥 Installation et Hébergement

### Création du bot Discord

1. Rendez-vous sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Cliquez sur "Nouvelle Application"
3. Dans l'onglet "Bot", cochez les 3 "Privileged Gateway Intents" (Presence, Server, Message Content)
4. Réinitialisez le token et conservez-le (ne le partagez jamais)

### Invitation du bot sur votre serveur

1. Allez dans l'onglet "OAuth2"
2. Dans "OAuth2 URL Generator", cochez "Bot" et "Administrator"
3. Copiez-collez l'URL générée dans un autre onglet et suivez les instructions

### Hébergement sur Render (Gratuit, PC & Mobile)

1. Faites un fork du GitHub: [https://github.com/AshuyaTT/TurkishPrivaxx/fork](https://github.com/AshuyaTT/TurkishPrivaxx/fork)
2. Modifiez le fichier `config.js`:
   - `buyer` - changez par votre ID
   - `couleur`, `footer`, `maxServer`, `prefixe` - personnalisez selon vos préférences

3. Sur [Render](https://render.com/), créez un compte
4. Créez un service web avec les paramètres suivants:
   - Lien: votre fork GitHub
   - Région: Virginia
   - Runtime: Node
   - Commande de construction: `npm i`
   - Commande de démarrage: `node index.js`
   - Type d'instance: Gratuit
   - Variables d'environnement:
     - `token`: votre token Discord
     - `NODE_VERSION`: 16.20.0

5. Créez votre service web et vérifiez les logs pour confirmer le démarrage

### Maintenir le bot en ligne 24/7

1. Sur [cron-job.org](https://cron-job.org/), créez un compte
2. Dans le dashboard, créez un nouveau Cronjob:
   - Nom: Au choix
   - URL: L'URL de votre service Render
   - Calendrier d'exécution: Chaque minute
3. Créez le Cronjob

## 🚀 Configuration rapide

La commande `+setupserver` configure automatiquement votre serveur avec:

- Tous les salons de logs (messages, modération, raid, etc.)
- Des salons généraux (texte et vocaux)
- Des salons pour les mini-jeux
- Des salons pour les tickets et le ModMail
- Des salons pour l'économie
- Des salons pour la modération
- Une hiérarchie complète de rôles:
  - Rôles administratifs (Fondateur, Administrateur, Responsable, Modérateur)
  - Rôles spéciaux (Support, Partenaire, VIP, Booster)
  - Rôles de niveaux (Niveau 100, 50, 25)
  - Rôles de base (Membre vérifié, Membre)
  - Rôles de couleurs

## 📋 Guide des Fonctionnalités

### 📨 ModMail

Permet aux utilisateurs de contacter le staff via messages privés:

- `+modmail` - Ouvre un ticket pour contacter le staff
- `+modmailconfig` - Configure le système (logs, catégorie, rôle staff)
- `+reply <message>` - Permet au staff de répondre aux utilisateurs
- `+close [raison]` - Ferme un ticket avec une raison optionnelle

### 👑 Menu de Rôles Avancé

Système de menus déroulants avec catégories:

- `+rolemenu create` - Crée un menu interactif avancé
- `+rolemenu category add/remove <menuId> <nom/categoryId>` - Gère les catégories
- `+rolemenu role add/remove <menuId> <categoryId> <role> [description]` - Gère les rôles
- `+rolemenu show <menuId>` - Affiche le menu dans un salon

### 📋 Logs Centralisés

Système unifié pour tous les types de logs:

- `+logsystem` - Configure tous les types de logs en un seul endroit
- `+logsystem enable/disable <type>` - Active/désactive un type de logs
- `+logsystem channel <type> <salon>` - Configure le salon pour un type de logs
- `+logsystem test <type>` - Teste un type de logs

Types disponibles: memberLogs, messageLogs, moderationLogs, raidLogs, ticketLogs, giveawayLogs, boostLogs, roleLogs, modmailLogs, captchaLogs, serverLogs

### 🔊 Vocaux Temporaires

Le système crée automatiquement des salons vocaux personnalisés:

- Rejoignez le salon "➕ Créer un salon" pour générer votre vocal
- Vous avez le contrôle total de votre salon (permissions, nom, limite)
- Le salon est supprimé automatiquement quand il est vide

### 🛡️ Modération

Suite complète d'outils de modération:

- `+kick <membre> [raison]` - Expulse un membre
- `+ban <membre> [raison]` - Bannit un membre
- `+mute <membre> [durée]` - Réduit au silence un membre
- `+clear [nombre]` - Supprime des messages
- `+lock/unlock [salon]` - Verrouille/déverrouille un salon
- Et plus encore...

### 🔒 Antiraid

Protection contre les attaques et raids:

- `+secur on/off` - Active/désactive toutes les protections
- `+sanction` - Configure la sanction pour les actions non autorisées
- Protections individuelles pour les bans, roles, channels, bots, etc.

### 🤖 Automodération

Filtre automatiquement les contenus inappropriés:

- `+automodconfig` - Configure les paramètres (liens, spam, insultes, mentions)
- Définit les sanctions et les exemptions

### 📈 Système de Niveaux

Récompense l'activité des membres:

- `+rank [membre]` - Affiche le niveau d'un utilisateur
- `+leaderboard` - Affiche le classement des membres
- `+levelconfig` - Configure le système (taux d'XP, salon d'annonce)

### 🔢 Compteurs

Affiche des statistiques en temps réel:

- `+counterconfig` - Configure les compteurs (membres, bots, salons, etc.)
- Mise à jour automatique des noms des salons

### 👤 Profils Personnalisés

Personnalisation avancée des profils:

- `+profile [utilisateur]` - Affiche un profil
- `+setbio <texte>` - Définit une biographie
- `+setcolor <couleur>` - Définit une couleur
- `+setbanner <lien>` - Définit une bannière
- `+badges` - Gère les badges des utilisateurs

### 🎮 Mini-Jeux

Divertissement avec gains économiques:

- `+coinflip <pile/face> <montant>` - Pari sur pile ou face
- `+dice <nombre> <montant>` - Pari sur un dé
- `+rps <pierre/feuille/ciseaux> [montant]` - Pierre-feuille-ciseaux
- `+8ball <question>` - Pose une question à la boule magique
- `+slots <montant>` - Machine à sous

### 💰 Économie

Système économique complet:

- `+balance [utilisateur]` - Affiche un solde
- `+daily` - Récompense quotidienne
- `+work` - Travaille pour gagner de l'argent
- `+pay <utilisateur> <montant>` - Transfère de l'argent
- `+shop` - Boutique du serveur
- `+inventory` - Inventaire des objets

### 🔗 Traceur d'Invitations

Suit les invitations des membres:

- `+invites [utilisateur]` - Statistiques d'invitation
- `+invitesleaderboard` - Classement des inviteurs
- `+inviteconfig` - Configure le système

### 👥 Système de Teams

Création et gestion d'équipes:

- `+teamcreate <nom> [description]` - Crée une équipe
- `+teamdelete` - Supprime une équipe
- `+teamjoin <nom>` - Rejoint une équipe
- `+teaminvite <membre>` - Invite un membre
- `+teaminfo [nom]` - Informations sur une équipe
- `+teamlist` - Liste des équipes

### ✅ Captcha

Vérification des nouveaux membres:

- `+captchaconfig` - Configure le système (difficulté, salon, rôle)
- Protection contre les raids et bots

### 📊 Statistiques

Données détaillées sur le serveur:

- `+serverstats` - Statistiques du serveur
- `+userstats [utilisateur]` - Statistiques d'un utilisateur
- `+botstats` - Statistiques du bot
- `+messagestats [utilisateur]` - Statistiques des messages

### 🎁 Giveaways

Organisation de concours:

- `+giveaway` - Crée un giveaway
- `+end` - Termine un giveaway
- `+reroll` - Relance un giveaway

### 📝 Générateur d'Embeds

Création de messages enrichis:

- `+embed` - Ouvre un menu interactif pour créer un embed

### 🎵 Musique

Lecture de musique depuis plusieurs sources:

- `+play <lien/titre>` - Joue une musique (YouTube, Spotify, SoundCloud)
- `+skip` - Passe à la musique suivante
- `+stop` - Arrête la lecture
- `+pause/resume` - Met en pause/reprend la lecture
- `+queue` - Affiche la file d'attente
- `+volume <1-100>` - Règle le volume

## 🔍 Besoin d'aide?

Utilisez la commande `+help` pour afficher toutes les commandes disponibles, organisées par catégories dans un menu interactif.

Pour plus d'informations sur une fonctionnalité spécifique, utilisez `+help` et sélectionnez la catégorie correspondante dans le menu déroulant.

## 👨‍💻 Crédits

par AshuyaTT.

---

© 2025 TurkishPrivaxx - Un bot Discord multi-fonctions