import ytdl from 'ytdl-core';
import { Command } from '../interfaces/Command';
import {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice';
import { replayFromLastTime } from '../utils/voiceUtils';
import fs from 'fs';
import { promisify } from 'util';
import { Readable } from 'stream';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const play: Command = {
    name: 'play',
    description: 'Download and play a song from YouTube',
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

        // Define el nombre del archivo temporal
        const tempFileName = `playing.mp4`;

        try {
            // Obtiene información del video para el título
            const videoInfo = await ytdl.getInfo(link);
            const videoTitle = videoInfo.videoDetails.title;

            // Descarga el video
            const videoStream = ytdl(link, { filter: 'audioonly' });
            const videoBuffer = await streamToBuffer(videoStream);
            await writeFileAsync(tempFileName, videoBuffer as Buffer);

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
            }

            // Reproduce el archivo descargado
            const connection = await joinVoiceChannel({
                channelId: member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            console.log(' al parecer se descargo y funco');

            const player = createAudioPlayer();
            const resource = createAudioResource(tempFileName);
            connection.subscribe(player);
            player.play(resource);

            await interaction.reply(`Reproduciendo: **${videoTitle}**`);

            // Elimina el archivo temporal después de la reproducción
            player.on('stateChange', (oldState, newState) => {
                if (newState.status === 'idle') {
                    unlinkAsync(tempFileName).catch(console.error);
                }
            });
        } catch (error) {
            console.log('🚀 ~ execute: ~ error:', error);
            await interaction.reply(
                'Hubo un error al intentar reproducir el video.',
            );
            // Intenta eliminar el archivo temporal en caso de error
            unlinkAsync(tempFileName).catch(console.error);
        }
    },
};

export default play;

// Función auxiliar para convertir un stream a buffer
function streamToBuffer(stream: Readable) {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
