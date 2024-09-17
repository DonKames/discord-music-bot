import "dotenv/config";
import { ExtendedClient } from "./ExtendedClient";
import { loadCommands } from "./utils/loadCommands";
import { loadEvents } from "./utils/loadEvents";
import { handleInteraction } from "./utils/handleInteraction";
import { errorHandler } from "./utils/errorHandler";
import { Events } from "discord.js";

// Crea una instancia del cliente extendido
const client = ExtendedClient.getInstance();

client.on("error", (error) => errorHandler(error));

// Carga los comandos desde el directorio
loadCommands(client);

// Carga los eventos desde el directorio
loadEvents(client);

// Inicia sesión en Discord con el token del bott
client.login(process.env.DISCORD_TOKEN);
