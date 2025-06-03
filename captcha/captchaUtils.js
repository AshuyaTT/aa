// Try to load canvas but make it optional
let createCanvas;
let canvasAvailable = false;
try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    canvasAvailable = true;
    console.log("Module canvas chargé avec succès");
} catch (error) {
    console.log("Module canvas non disponible, fonctionnalité de captcha visuel désactivée");
}

const db = require('quick.db');
const captcha = new db.table("Captcha");

/**
 * Generates a random captcha
 * @param {string} difficulty - The difficulty level (easy, medium, hard)
 * @returns {Object} Object containing captcha text and image
 */
function generateCaptcha(difficulty = 'medium') {
    // Determine length based on difficulty
    let length;
    switch (difficulty) {
        case 'easy':
            length = 4;
            break;
        case 'hard':
            length = 8;
            break;
        case 'medium':
        default:
            length = 6;
            break;
    }

    // Generate random text
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let captchaText = '';
    for (let i = 0; i < length; i++) {
        captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    let captchaImage = null;

    // Only create image if canvas is available
    if (canvasAvailable) {
        // Create canvas for the captcha
        const canvas = createCanvas(300, 100);
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise (dots)
        for (let i = 0; i < 1000; i++) {
            ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }

        // Add lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Add text
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add each character with slight rotation
        for (let i = 0; i < captchaText.length; i++) {
            const x = 50 + (i * 35);
            const y = 50 + (Math.random() * 20 - 10);
            const rotation = Math.random() * 0.4 - 0.2; // Random rotation between -0.2 and 0.2 radians

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillText(captchaText[i], 0, 0);
            ctx.restore();
        }

        // Convert canvas to data URL
        captchaImage = canvas.toDataURL();
    }

    return {
        captchaText,
        captchaImage,
        canvasAvailable
    };
}

/**
 * Creates a verification session for a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {string} captchaText - The captcha text to verify against
 * @param {number} timeout - Timeout in seconds
 */
function createVerificationSession(guildId, userId, captchaText, timeout = 120) {
    const expiresAt = Date.now() + (timeout * 1000);
    
    captcha.set(`verification_${guildId}_${userId}`, {
        captchaText,
        expiresAt,
        attempts: 0
    });

    // Set a timeout to delete the verification session after it expires
    setTimeout(() => {
        const session = captcha.get(`verification_${guildId}_${userId}`);
        if (session && session.expiresAt <= Date.now()) {
            captcha.delete(`verification_${guildId}_${userId}`);
        }
    }, timeout * 1000);
}

/**
 * Verifies a captcha response
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {string} response - The user's response
 * @returns {Object} Verification result
 */
function verifyCaptcha(guildId, userId, response) {
    const session = captcha.get(`verification_${guildId}_${userId}`);
    
    // Check if session exists
    if (!session) {
        return {
            success: false,
            message: "Aucune session de vérification trouvée. Veuillez rejoindre à nouveau le serveur."
        };
    }

    // Check if session has expired
    if (session.expiresAt <= Date.now()) {
        captcha.delete(`verification_${guildId}_${userId}`);
        return {
            success: false,
            message: "La session de vérification a expiré. Veuillez rejoindre à nouveau le serveur."
        };
    }

    // Increment attempts
    session.attempts++;
    captcha.set(`verification_${guildId}_${userId}`, session);

    // Check if max attempts reached (3 attempts)
    if (session.attempts > 3) {
        captcha.delete(`verification_${guildId}_${userId}`);
        return {
            success: false,
            message: "Trop de tentatives incorrectes. Veuillez rejoindre à nouveau le serveur."
        };
    }

    // Check if response is correct (case insensitive)
    if (response.toLowerCase() === session.captchaText.toLowerCase()) {
        captcha.delete(`verification_${guildId}_${userId}`);
        return {
            success: true,
            message: "Vérification réussie!"
        };
    } else {
        return {
            success: false,
            message: `Réponse incorrecte. Il vous reste ${3 - session.attempts} tentative(s).`
        };
    }
}

/**
 * Gets the verification settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} Verification settings
 */
function getVerificationSettings(guildId) {
    const enabled = captcha.get(`captcha_enabled_${guildId}`) || false;
    const channelId = captcha.get(`captcha_channel_${guildId}`);
    const roleId = captcha.get(`captcha_role_${guildId}`);
    const difficulty = captcha.get(`captcha_difficulty_${guildId}`) || 'medium';
    const timeout = captcha.get(`captcha_timeout_${guildId}`) || 120;

    return {
        enabled,
        channelId,
        roleId,
        difficulty,
        timeout
    };
}

module.exports = {
    generateCaptcha,
    createVerificationSession,
    verifyCaptcha,
    getVerificationSettings,
    canvasAvailable
};