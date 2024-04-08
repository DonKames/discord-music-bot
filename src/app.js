import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.once('ready', () => {
    console.log('El bot esta listo!');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'test') {
        await interaction.reply('Hello, World!');
    } else if (commandName === 'play') {
        // Asegúrate de que el comando se usa en un servidor, no en DMs
        if (!interaction.guildId)
            return interaction.reply(
                'Este comando solo puede ser usado en un servidor.',
            );

        const member = await interaction.guild.members.fetch(
            interaction.user.id,
        );

        // Verifica si el miembro está en un canal de voz
        if (!member.voice.channelId) {
            return interaction.reply(
                'Debes estar en un canal de voz para usar este comando.',
            );
        } else {
            // Si el miembro está en un canal de voz, únete a ese canal
            // const connection = await member.voice.channel.join();
            await interaction.reply('Conectado!');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
