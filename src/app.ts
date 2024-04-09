import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { playCommand } from './commands/play';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const eventFiles = fs
    .readdirSync(path.join(__dirname, 'events'))
    .filter((file) => file.endsWith('.ts'));

for (const file of eventFiles) {
    import(path.join(__dirname, 'events', file)).then((event) => {
        if (event.once) {
            client.once(event.name, (...args) =>
                event.execute(...args, client),
            );
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    });
}

// client.once('ready', () => {
//     console.log('El bot esta listo!');
// });

client.on('interactionCreate', async (interaction) => {
    // console.log('🚀 ~ client.on ~ interaction:', interaction);

    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'test') {
        await interaction.reply('Hello, World!');
    } else if (commandName === 'play') {
        await playCommand(interaction);
    }
});

client.login(process.env.DISCORD_TOKEN);
