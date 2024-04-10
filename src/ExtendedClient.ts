import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { Command } from './interfaces/Command';
import { MusicQueue } from './utils/MusiQueue';

// Extiende la clase Client para incluir una colección de comandos.
export class ExtendedClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public musicQueue: MusicQueue = new MusicQueue();

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
