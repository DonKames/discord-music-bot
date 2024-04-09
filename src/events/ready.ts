import { Client } from 'discord.js';

export const name = 'ready';
export const once = true;

export function execute(client: Client) {
    console.log(`El bot está listo! Logueado como ${client.user?.tag}`);
}
