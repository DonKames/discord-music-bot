import ytdl from 'ytdl-core';
import {
    AudioPlayer,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice';
import { CommandInteraction } from 'discord.js';

// Guarda el último tiempo de reproducción conocido
let lastPlayTime = 0;
// Indica si el bot está intentando reanudar la reproducción
let isAttemptingReplay = false;
export async function playCommand(interaction: CommandInteraction) {
    // if (!interaction.isCommand() || interaction.commandName !== 'play') return;

    const linkOption = interaction.options.get('link', true);
    console.log('🚀 ~ playCommand ~ linkOption:', linkOption);

    // Asegura que el valor es un string
    const link = linkOption.value as string;
    console.log('🚀 ~ playCommand ~ link:', link);

    if (!link)
        return interaction.reply(
            'Este comando solo puede ser usado en un servidor.',
        );

    const videoInfo = await ytdl.getInfo(link);
    // console.log('🚀 ~ playCommand ~ videoInfo:', videoInfo);
    const videoTitle = videoInfo.videoDetails.title;
    console.log('🚀 ~ playCommand ~ videoTitle:', videoTitle);

    // Revisa que el comando se usa en un servidor, no en DMs
    if (!interaction.guildId)
        return interaction.reply(
            'Este comando solo puede ser usado en un servidor.',
        );
    // Revisa que exista guild
    if (!interaction.guild) {
        return interaction.reply(
            'Este comando solo puede ser usado dentro de un servidor.',
        );
    }

    // Obtiene el miembro que ejecutó el comando
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Verifica si el miembro está en un canal de voz
    if (!member.voice.channelId) {
        return interaction.reply(
            'Debes estar en un canal de voz para usar este comando.',
        );
    } else {
        try {
            // Si el miembro está en un canal de voz, se une al canal
            const connection = joinVoiceChannel({
                channelId: member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();

            player.on('error', (error) => {
                console.error('Error en el AudioPlayer:', error.message);

                // Intento de Reanudar la reproducción
                if (!isAttemptingReplay) {
                    isAttemptingReplay = true;
                    // Intenta re-conectar después de un breve retraso
                    setTimeout(() => {
                        replayFromLastTime(player, link, lastPlayTime);
                    }, 1000); // Ajusta el tiempo de retraso según sea necesario
                }
            });

            connection.subscribe(player);

            const stream = ytdl(link, { filter: 'audioonly' });

            const resource = createAudioResource(stream);

            player.play(resource);

            await interaction.reply(`Reproduciendo: **${videoTitle}**`);
        } catch (error) {
            console.log('🚀 ~ playCommand ~ error:', error);
            await interaction.reply('Error al reproducir audio.');
        }
    }
}

function replayFromLastTime(
    player: AudioPlayer,
    link: string,
    startTime: number,
) {
    // Implementa la lógica para reiniciar la reproducción usando ytdl-core
    // y saltar al tiempo de inicio especificado si es posible
    const streamOptions = {
        filter: 'audioonly' as const,
        begin: startTime * 1000,
    };
    const stream = ytdl(link, streamOptions);
    const resource = createAudioResource(stream);
    player.play(resource);
    isAttemptingReplay = false;
}
