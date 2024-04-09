import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { Command } from './interfaces/Command';

// Extiende la clase Client para incluir una colección de comandos.
export class ExtendedClient extends Client {
    public commands: Collection<string, Command> = new Collection();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
            ],
        });
    }
}
