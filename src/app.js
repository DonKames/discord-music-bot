import 'dotenv/config';
import ytdl from 'ytdl-core';
import { Client, GatewayIntentBits } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioResource,
    createAudioPlayer,
    StreamType,
} from '@discordjs/voice';

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
    console.log('🚀 ~ client.on ~ interaction:', interaction);

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
            try {
                // Si el miembro está en un canal de voz, únete a ese canal
                const connection = joinVoiceChannel({
                    channelId: member.voice.channelId,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                console.log('pasa joinVoiceChannel');

                const player = createAudioPlayer();

                console.log('pasa createAudioPlayer');

                connection.subscribe(player);

                const stream = ytdl(
                    'https://youtu.be/dmDyGkzc6x0?list=RD_6XzJPyAJDI',
                    { filter: 'audioonly' },
                );

                const resource = createAudioResource(stream);

                console.log('pasa subscribe');

                // const resource = createAudioResource('assets/Grabación.m4a', {
                //     inputType: StreamType.Arbitrary,
                // });

                player.play(resource);

                console.log('pasa createAudioResource');

                await interaction.reply('Reproduciendo....');
                // await interaction.reply('Conectado!');
            } catch (error) {
                console.log('error:', error);
                await interaction.reply('Error al reproducir audio.');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
