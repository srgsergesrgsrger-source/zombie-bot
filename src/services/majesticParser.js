const axios = require('axios');
const logger = require('../utils/logger');

const API_URL = 'https://wiki.majestic-rp.ru/api/online';

async function getServersOnline() {
    try {
        logger.debug('[Parser] Запрос к API Majestic RP...');

        const response = await axios.get(API_URL, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'ru',
            },
        });

        const data = response.data;

        if (data.status !== 'ok' || !data.data || !data.data.servers) {
            throw new Error('Неожиданный формат ответа API');
        }

        const servers = data.data.servers
            .filter(s => s.status === true)
            .map(s => ({
                name: s.name,
                players: s.players,
                queue: s.queuedPlayers || 0,
            }));

        logger.success(`[Parser] Получены данные: ${servers.length} серверов, всего онлайн: ${data.data.players}`);
        return servers;

    } catch (err) {
        logger.error('[Parser] Критическая ошибка:', err.message);
        throw err;
    }
}

module.exports = { getServersOnline };