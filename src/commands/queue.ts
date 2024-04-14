import { CommandInteraction } from "discord.js";
import { Command } from "../interfaces/Command";
import { ExtendedClient } from "../ExtendedClient";

const queue: Command = {
  name: "queue",
  description: "Show the current music queue",
  execute: async (interaction: CommandInteraction) => {
    const client = interaction.client as ExtendedClient;

    if (!client.musicQueue || client.musicQueue.queue.length === 0) {
      await interaction.reply("No hay canciones en la cola de reproducción.");

      return;
    } else {
      const queue = client.musicQueue.queue.map((song, index) => {
        return `${index + 1}. ${song.title}`;
      });

      await interaction.reply(`**Cola de reproducción:**\n${queue.join("\n")}`);
    }
  },
};

export default queue;
