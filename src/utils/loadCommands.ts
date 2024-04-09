import fs from 'fs';
import path from 'path';
import { ExtendedClient } from '../ExtendedClient';
import { Command } from '../interfaces/Command';

/**
 * The function `loadCommands` loads command modules from files in a directory and adds them to a
 * client's commands collection.
 * @param {ExtendedClient} client - The `client` parameter is an instance of the `ExtendedClient`
 * class.
 */
export function loadCommands(client: ExtendedClient) {
    // Itera sobre cada archivo de comando encontrado
    const commandFiles = fs
        .readdirSync(path.join(__dirname, '..', 'commands'))
        .filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
        // Importa dinámicamente el módulo de comando
        import(path.join(__dirname, '..', 'commands', file)).then(
            (commandModule) => {
                const command: Command = commandModule.default;
                client.commands.set(command.name, command);
            },
        );
    }
}
