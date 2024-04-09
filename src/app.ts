import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Command } from './interfaces/Command';
import { ExtendedClient } from './ExtendedClient';

const client = new ExtendedClient();

const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter((file) => file.endsWith('.ts'));

for (const file of commandFiles) {
    import(path.join(__dirname, 'commands', file)).then((commandModule) => {
        const command: Command = commandModule.default;
        client.commands.set(command.name, command);
    });
}

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

client.on('interactionCreate', async (interaction) => {
    // console.log('🚀 ~ client.on ~ interaction:', interaction);

    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.log('🚀 ~ client.on ~ error:', error);
        await interaction.reply({
            content: 'Hubo un error al ejecutar este comando.',
            ephemeral: true,
        });
    }

    // const { commandName } = interaction;

    // if (commandName === 'test') {
    //     await interaction.reply('Hello, World!');
    // } else if (commandName === 'play') {
    //     await interaction.reply({
    //         content: 'Hubo un error al ejecutar este comando.',
    //         ephemeral: true,
    //     });
    // }
});

client.login(process.env.DISCORD_TOKEN);
