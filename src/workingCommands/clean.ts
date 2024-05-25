import { CommandInteraction } from "discord.js";
import { Command } from "../interfaces/Command";

const clean: Command = {
  name: "clean",
  description: "Limpia la cola de música",
  execute: async (interaction: CommandInteraction) => {},
};

export default clean;
