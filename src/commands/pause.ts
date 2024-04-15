import { CommandInteraction } from "discord.js";
import { Command } from "../interfaces/Command";
import { ExtendedClient } from "../ExtendedClient";
import { Music } from "../utils/Music";

const pause: Command = {
  name: "pause",
  description: "Pauses the current song",
  execute: async (interaction: CommandInteraction) => {
    const client = interaction.client as ExtendedClient;

    const music = Music.getInstance();

    if (!client.music || !client.music.isPlaying) {
      await interaction.reply("There is no song playing.");
      return;
    } else {
      client.music.queue.pause();
      await interaction.reply("Song paused.");
    }
  },
};

export default pause;
