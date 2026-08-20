const { Player } = require('discord-player');
const { Client } = require('discord.js');
const client = new Client({ intents: [] });
const player = new Player(client);
console.log('loadDefault', typeof player.extractors.loadDefault);
console.log('loadAll', typeof player.extractors.loadAll);
console.log('load', typeof player.extractors.load);
