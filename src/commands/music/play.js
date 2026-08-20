const { QueryType } = require("discord-player");

module.exports = {
  name: "play",
  run: async (client, message, args) => {
    const voiceChannel = message.member?.voice?.channel;
    if (!voiceChannel) {
      return message.reply("❌ Tu dois être en salon vocal.");
    }

    const query = args.join(" ");
    if (!query) {
      return message.reply("❌ Tu dois fournir un titre ou un lien.");
    }

    const loadingMsg = await message.reply("🔍 Recherche en cours...");

    try {
      let searchResult = await client.player.search(query, {
        requestedBy: message.author,
        searchEngine: QueryType.AUTO,
      });

      if (!searchResult || !searchResult.tracks.length) {
        searchResult = await client.player.search(query, {
          requestedBy: message.author,
          searchEngine: QueryType.AUTO_SEARCH,
        });
      }

      if (!searchResult || !searchResult.tracks.length) {
        const fallbackType = query.includes("soundcloud.com")
          ? QueryType.SOUNDCLOUD_TRACK
          : QueryType.YOUTUBE_VIDEO;

        searchResult = await client.player.search(query, {
          requestedBy: message.author,
          searchEngine: fallbackType,
        });
      }

      if (!searchResult || !searchResult.tracks.length) {
        return loadingMsg.edit("❌ Aucun résultat trouvé.");
      }

      const track = searchResult.tracks[0];

      await client.player.play(voiceChannel, track, {
        metadata: {
          channel: message.channel,
          requestedBy: message.author,
        },
        leaveOnEnd: false,
        leaveOnEmpty: false,
        leaveOnStop: false,
        volume: 80,
        selfDeaf: false,
      });

      return loadingMsg.edit(
        `▶️ Lecture de **${track.title}** dans **${voiceChannel.name}** !`
      );
    } catch (err) {
      console.error("PLAY ERROR:", err);
      return loadingMsg.edit(
        "❌ Impossible de lire cette musique pour l’instant."
      );
    }
  },
};
