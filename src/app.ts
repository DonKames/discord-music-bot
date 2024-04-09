import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Command } from './interfaces/Command';
import { ExtendedClient } from './ExtendedClient';

// Crea una instancia del cliente extendido
const client = new ExtendedClient();

// Lee los archivos de comandos del directorio 'commands', y crea un
// string[] con los nombres de los archivos
const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter((file) => file.endsWith('.ts'));

// Itera sobre cada archivo de comando encontrado
for (const file of commandFiles) {
    // Importa dinámicamente el módulo de comando
    import(path.join(__dirname, 'commands', file)).then((commandModule) => {
        const command: Command = commandModule.default;
        client.commands.set(command.name, command);
    });
}

// Lee los archivos de eventos del directorio 'events', y crea un
// string[] con los nombres de los archivos
const eventFiles = fs
    .readdirSync(path.join(__dirname, 'events'))
    .filter((file) => file.endsWith('.ts'));

// Itera sobre cada archivo de evento encontrado
for (const file of eventFiles) {
    // Importa dinámicamente el módulo de evento
    import(path.join(__dirname, 'events', file)).then((event) => {
        // Registra el evento con el cliente, usando 'once' o 'on' según corresponda
        if (event.once) {
            client.once(event.name, (...args) =>
                event.execute(...args, client),
            );
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    });
}

// Manejador para el evento 'interactionCreate'
client.on('interactionCreate', async (interaction) => {
    // Si la interacción no es un comando, ignora
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        // Ejecuta el comando
        await command.execute(interaction);
    } catch (error) {
        // Si ocurre un error al ejecutar el comando, informa al usuario
        console.log('🚀 ~ client.on ~ error:', error);
        await interaction.reply({
            content: 'Hubo un error al ejecutar este comando.',
            ephemeral: true,
        });
    }
});

// Inicia sesión en Discord con el token del bot
client.login(process.env.DISCORD_TOKEN);
