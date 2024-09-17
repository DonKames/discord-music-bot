import { Client, Events } from "discord.js";

export const ready = {
  name: Events.ClientReady,
  once: true,
  execute: (client: Client) => {
    console.log(`El bot está listo! Logueado como ${client.user?.tag}`);
  },
};
