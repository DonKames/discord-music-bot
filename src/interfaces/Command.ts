import { CommandInteraction } from 'discord.js';

export interface Command {
    name: string;
    description: string;
    execute: (interaction: CommandInteraction) => Promise<void>;
}
