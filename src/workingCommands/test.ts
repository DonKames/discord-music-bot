import { CommandInteraction } from 'discord.js';
import { Command } from '../interfaces/Command';

const test: Command = {
    name: 'test',
    description: 'Responds with Hello, World!',
    execute: async (interaction: CommandInteraction) => {
        await interaction.reply('Hello, World!');
    },
};

export default test;
