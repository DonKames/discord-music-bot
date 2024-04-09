import { CommandInteraction } from 'discord.js';
import { ExtendedClient } from '../ExtendedClient';

export async function handleInteraction(
    client: ExtendedClient,
    interaction: CommandInteraction,
) {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error al ejecutar el comando:', error);
        await interaction.reply({
            content: 'Hubo un error al ejecutar este comando.',
            ephemeral: true,
        });
    }
}
