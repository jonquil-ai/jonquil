const axios = require('axios');
const logger = require('@jonquil-ai/logger');

module.exports = {
    category: 'action',
    platforms: ['telegram', 'whatsapp'],
    schema: {
        name: "music_search",
        description: "Provides direct access to the iTunes/Apple Music API. Use this to search for music, lookup discographies by ID, or play a 30-second audio track in the chat.",
        parameters: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["search", "lookup", "play"],
                    description: "The endpoint to use: 'search' (by keyword), 'lookup' (fetch sub-items by ID), or 'play' (dispatch 30s audio to the user)."
                },
                term: {
                    type: "string",
                    description: "Search keyword. Required if action is 'search' or 'play' (if no ID is provided)."
                },
                id: {
                    type: "number",
                    description: "iTunes ID (trackId, collectionId, or artistId). Required if action is 'lookup' or 'play' (if bypassing term search)."
                },
                entity: {
                    type: "string",
                    enum: ["song", "album", "musicArtist"],
                    description: "The type of entity to query. Default is 'song'."
                },
                country: {
                    type: "string",
                    description: "ISO country code for the storefront (e.g., 'US', 'TR', 'GB'). Choose based on the user's language/query context. Default is 'US'."
                },
                limit: {
                    type: "number",
                    description: "Number of raw data results to return.",
                    minimum: 1,
                    maximum: 20
                }
            },
            required: ["action"]
        }
    },
    execute: async (args) => {
        const { action, term, id, entity = 'song', country = 'US', limit = 10 } = args;

        logger.info('TOOL', `iTunes API -> Action: ${action} | Country: ${country} | Entity: ${entity}`);

        const cleanRawData = (item) => ({
            id: item.trackId || item.collectionId || item.artistId,
            type: item.wrapperType || item.kind,
            name: item.trackName || item.collectionName || item.artistName,
            artist: item.artistName,
            album: item.collectionName || null,
            genre: item.primaryGenreName,
            year: item.releaseDate ? item.releaseDate.substring(0, 4) : null,
            trackNumber: item.trackNumber || null,
            hasPreview: !!item.previewUrl,
            previewUrl: item.previewUrl || null,
            coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null
        });

        try {
            // raw search
            if (action === 'search') {
                if (!term) return { success: false, error: "The 'term' parameter is required for the search function." };

                const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&media=music&entity=${entity}&limit=${limit}`;
                const response = await axios.get(url);

                return {
                    success: true,
                    resultCount: response.data.resultCount,
                    data: response.data.results.map(cleanRawData)
                };
            }

            // raw lookup
            if (action === 'lookup') {
                if (!id) return { success: false, error: "Lookup için 'id' zorunludur." };

                const url = `https://itunes.apple.com/lookup?id=${id}&entity=${entity}&country=${country}&limit=${limit}`;
                const response = await axios.get(url);

                return {
                    success: true,
                    resultCount: response.data.resultCount,
                    data: response.data.results.map(cleanRawData)
                };
            }

            // play
            if (action === 'play') {
                let track = null;

                // by id
                if (id) {
                    const url = `https://itunes.apple.com/lookup?id=${id}&country=${country}`;
                    const res = await axios.get(url);
                    track = res.data.results[0];
                }
                // by song name
                else if (term) {
                    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&media=music&entity=song&limit=1`;
                    const res = await axios.get(url);
                    track = res.data.results[0];
                }

                if (!track || !track.previewUrl) {
                    return { success: false, error: "No playable audio file was found for this content." };
                }

                const cleanedTrack = cleanRawData(track);

                return {
                    success: true,
                    info: "The audio file has been successfully sent to the user. Now, comment on/present your thoughts on this song to the user.",
                    playedData: cleanedTrack,
                    gatewayAction: {
                        type: 'send_media',
                        payload: {
                            mediaType: 'audio',
                            url: cleanedTrack.previewUrl,
                            mimeType: 'audio/mp4', // apple default -> M4A / AAC
                            caption: `🎵 **${cleanedTrack.name}**\n🎤 **${cleanedTrack.artist}**\n💿 ${cleanedTrack.album || 'Single'} (${cleanedTrack.year})`
                        }
                    }
                };
            }

            return { success: false, error: "Unknown action." };

        } catch (error) {
            logger.error('TOOL', `iTunes API Error: ${error.message}`);
            return { success: false, error: "Apple API connection error." };
        }
    }
};