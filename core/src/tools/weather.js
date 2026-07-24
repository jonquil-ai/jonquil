const axios = require('axios');
const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'tool',
    platforms: ['all'],
    schema: {
        name: "get_weather",
        description: "It retrieves real-time weather data for a specified location. Always use this when a user asks about the weather.",
        parameters: {
            type: "object",
            properties: {
                location: {
                    type: "string",
                    description: "Name of the city or country for which weather forecast is desired (e.g., Ankara, New York)"
                }
            },
            required: ["location"]
        }
    },

    execute: async (args) => {
        logger.info('TOOL', `get_weather running. Location: ${args.location}`);
        try {
            const url = `https://wttr.in/${encodeURIComponent(args.location)}?format=j1&lang=tr`;
            const response = await axios.get(url);

            const current = response.data.current_condition[0];
            const area = response.data.nearest_area[0];

            return {
                success: true,
                data: {
                    city: area.areaName[0].value,
                    country: area.country[0].value,
                    temp_C: current.temp_C,
                    feels_like_C: current.FeelsLikeC,
                    condition: current.lang_tr ? current.lang_tr[0].value : current.weatherDesc[0].value,
                    humidity: current.humidity
                }
            };
        } catch (error) {
            logger.error('TOOL', `get_weather error: ${error.message}`);
            return { success: false, error: "Weather data could not be obtained." };
        }
    }
};