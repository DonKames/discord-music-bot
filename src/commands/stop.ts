import { CommandInteraction } from "discord.js";
import { Command } from "../interfaces/Command";

const stop: Command = {
  name: "stop",
  description: "Detiene la canción actual",
  execute: async (interaction: CommandInteraction) => {},
};

export default stop;
