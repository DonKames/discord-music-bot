import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Command } from "./interfaces/Command";
import { Music } from "./utils/Music";

// Extiende la clase Client para incluir una colección de comandos.
export class ExtendedClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public music: Music = Music.getInstance();

  private static instance: ExtendedClient;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
  }

  public static getInstance(): ExtendedClient {
    if (!ExtendedClient.instance) {
      ExtendedClient.instance = new ExtendedClient();
    }

    return ExtendedClient.instance;
  }
}
