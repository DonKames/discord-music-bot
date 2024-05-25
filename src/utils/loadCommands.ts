import fs from "fs";
import path from "path";
import { ExtendedClient } from "../ExtendedClient";
import { Command } from "../interfaces/Command";
import { SlashCommandBuilder } from "discord.js";

/**
 * The function `loadCommands` loads command modules from files in a directory and adds them to a
 * client's commands collection.
 * @param {ExtendedClient} client - The `client` parameter is an instance of the `ExtendedClient`
 * class.
 */
export async function loadCommands(client: ExtendedClient) {
  // Itera sobre cada archivo de comando encontrado
  const commandFiles = fs
    .readdirSync(path.join(__dirname, "..", "commands"))
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    try {
      const commandModule = await import(
        path.join(__dirname, "..", "commands", file)
      );

      // Verifica si el módulo exporta un comando con SlashCommandBuilder
      if (
        commandModule &&
        commandModule.default &&
        commandModule.default.data instanceof SlashCommandBuilder
      ) {
        const command = commandModule.default;
        client.commands.set(command.data.name, command);
        console.log(`Comando cargado: ${command.data.name}`);
      } else {
        console.warn(`El archivo ${file} no contiene un comando válido.`);
      }

      //   // Importa dinámicamente el módulo de comando
      //   import(path.join(__dirname, "..", "commands", file)).then(
      //     (commandModule) => {
      //       const command: Command = commandModule.default;
      //       client.commands.set(command.name, command);
      //     }
      //   );
    } catch (error) {
      console.error(
        `Error al cargar el comando desde el archivo ${file}:`,
        error
      );
    }
  }
}
