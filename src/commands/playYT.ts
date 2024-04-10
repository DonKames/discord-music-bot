import ytdl from 'ytdl-core';
import { Command } from '../interfaces/Command';
import {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice';
import { replayFromLastTime } from '../utils/voiceUtils';

const play: Command = {
    name: 'playYT',
    description: 'Plays a song from YouTube',
    execute: async (interaction) => {
        // Guarda el último tiempo de reproducción conocido
        let lastPlayTime = 0;
        // Indica si el bot está intentando reanudar la reproducción
        let isAttemptingReplay = false;
        // if (!interaction.isCommand() || interaction.commandName !== 'play') return;

        const linkOption = interaction.options.get('link', true);
        console.log('🚀 ~ playCommand ~ linkOption:', linkOption);

        // Asegura que el valor es un string
        const link = linkOption.value as string;
        console.log('🚀 ~ playCommand ~ link:', link);

        if (!link) {
            await interaction.reply(
                'Este comando solo puede ser usado en un servidor.',
            );
            return;
        }

        const videoInfo = await ytdl.getInfo(link);
        // console.log('🚀 ~ playCommand ~ videoInfo:', videoInfo);
        const videoTitle = videoInfo.videoDetails.title;
        console.log('🚀 ~ playCommand ~ videoTitle:', videoTitle);

        // Revisa que el comando se usa en un servidor, no en DMs
        if (!interaction.guildId) {
            await interaction.reply(
                'Este comando solo puede ser usado en un servidor.',
            );
            return;
        }
        // Revisa que exista guild
        if (!interaction.guild) {
            {
                await interaction.reply(
                    'Este comando solo puede ser usado dentro de un servidor.',
                );
                return;
            }
        }

        // Obtiene el miembro que ejecutó el comando
        const member = await interaction.guild.members.fetch(
            interaction.user.id,
        );

        // Verifica si el miembro está en un canal de voz
        if (!member.voice.channelId) {
            {
                await interaction.reply(
                    'Debes estar en un canal de voz para usar este comando.',
                );
                return;
            }
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
                return;
            } catch (error) {
                console.log('🚀 ~ playCommand ~ error:', error);
                await interaction.reply('Error al reproducir audio.');
                return;
            }
        }
    },
};

export default play;
