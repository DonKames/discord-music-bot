import 'dotenv/config';
import ytdl from 'ytdl-core';
import { Client, GatewayIntentBits } from 'discord.js';
import {
    joinVoiceChannel,
    createAudioResource,
    createAudioPlayer,
    StreamType,
} from '@discordjs/voice';

// Guarda el último tiempo de reproducción conocido
let lastPlayTime = 0;

// Indica si el bot está intentando reanudar la reproducción
let isAttemptingReplay = false;

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
    // console.log('🚀 ~ client.on ~ interaction:', interaction);

    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'test') {
        await interaction.reply('Hello, World!');
    } else if (commandName === 'play') {
        const link = interaction.options.getString('link');
        console.log('🚀 ~ client.on ~ link:', link);

        const videoInfo = await ytdl.getInfo(link);
        // console.log('🚀 ~ client.on ~ videoInfo:', videoInfo.videoDetails);
        const videoTitle = videoInfo.videoDetails.title;
        const videoAuthor = videoInfo.videoDetails.author.name;
        const videoLength = videoInfo.videoDetails.lengthSeconds;

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

                player.on('error', (error) => {
                    console.error('Error en el AudioPlayer:', error.message);
                    // Implementa aquí cualquier lógica adicional para manejar el error
                    if (!isAttemptingReplay) {
                        isAttemptingReplay = true;
                        // Intenta reconectar después de un breve retraso
                        setTimeout(() => {
                            replayFromLastTime(lastPlayTime);
                        }, 1000); // Ajusta el tiempo de retraso según sea necesario
                    }
                });

                console.log('pasa createAudioPlayer');

                connection.subscribe(player);

                const stream = ytdl(link, { filter: 'audioonly' });
                // console.log('🚀 ~ client.on ~ stream:', stream);

                const resource = createAudioResource(stream);

                console.log('pasa subscribe');

                // const resource = createAudioResource('assets/Grabación.m4a', {
                //     inputType: StreamType.Arbitrary,
                // });

                player.play(resource);

                console.log('pasa createAudioResource');

                await interaction.reply(`Reproduciendo: **${videoTitle}**`);
                // await interaction.reply('Conectado!');
            } catch (error) {
                console.log('error:', error);
                await interaction.reply('Error al reproducir audio.');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

function replayFromLastTime(startTime) {
    // Implementa la lógica para reiniciar la reproducción usando ytdl-core
    // y saltar al tiempo de inicio especificado si es posible
    const streamOptions = { filter: 'audioonly', begin: startTime * 1000 }; // ytdl-core usa milisegundos
    const stream = ytdl('URL_DEL_VIDEO_DE_YOUTUBE', streamOptions);
    const resource = createAudioResource(stream);
    player.play(resource);
    isAttemptingReplay = false;
}
