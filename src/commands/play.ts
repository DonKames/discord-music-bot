import ytdl from 'ytdl-core';
import { Command } from '../interfaces/Command';
import {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice';
// import { replayFromLastTime } from '../utils/voiceUtils';
import fs from 'fs';
import { promisify } from 'util';
import { Readable } from 'stream';
import { ExtendedClient } from '../ExtendedClient';
import { QueueItem } from '../utils/MusiQueue';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const play: Command = {
    name: 'play',
    description: 'Download and play a song from YouTube',
    execute: async (interaction) => {
        const client = interaction.client as ExtendedClient;

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

        // try {
        // Obtiene información del video para el título
        const videoInfo = await ytdl.getInfo(link);
        const videoTitle = videoInfo.videoDetails.title;

        const song: QueueItem = {
            title: videoTitle,
            url: link,
        };

        // Si ya hay música reproduciéndose, añade a la cola y notifica al usuario
        if (client.musicQueue.playing) {
            client.musicQueue.addToQueue(song);
            await interaction.reply(`Añadido a la cola: **${videoTitle}**`);
        } else {
            // Si no hay música reproduciéndose, comienza a reproducir y establece el estado a reproduciendo
            client.musicQueue.playing = true;
            client.musicQueue.addToQueue(song);
            playSong(client, interaction, client.musicQueue.getNextItem()!);
        }

        //         // Descarga el video
        //         const videoStream = ytdl(link, { filter: 'audioonly' });
        //         const videoBuffer = await streamToBuffer(videoStream);
        //         await writeFileAsync(tempFileName, videoBuffer);

        //         // Revisa que exista guild
        //         if (!interaction.guild) {
        //             {
        //                 await interaction.reply(
        //                     'Este comando solo puede ser usado dentro de un servidor.',
        //                 );
        //                 return;
        //             }
        //         }

        //         // Obtiene el miembro que ejecutó el comando
        //         const member = await interaction.guild.members.fetch(
        //             interaction.user.id,
        //         );

        //         // Revisa que el comando se usa en un servidor, no en DMs
        //         if (!interaction.guildId) {
        //             await interaction.reply(
        //                 'Este comando solo puede ser usado en un servidor.',
        //             );
        //             return;
        //         }

        //         // Verifica si el miembro está en un canal de voz
        //         if (!member.voice.channelId) {
        //             {
        //                 await interaction.reply(
        //                     'Debes estar en un canal de voz para usar este comando.',
        //                 );
        //                 return;
        //             }
        //         }

        //         // Reproduce el archivo descargado
        //         const connection = joinVoiceChannel({
        //             channelId: member.voice.channelId,
        //             guildId: interaction.guildId,
        //             adapterCreator: interaction.guild.voiceAdapterCreator,
        //         });

        //         const player = createAudioPlayer();
        //         const resource = createAudioResource(tempFileName);
        //         connection.subscribe(player);
        //         player.play(resource);

        //         await interaction.reply(`Reproduciendo: **${videoTitle}**`);

        //         // Elimina el archivo temporal después de la reproducción
        //         player.on('stateChange', (oldState, newState) => {
        //             if (newState.status === 'idle') {
        //                 unlinkAsync(tempFileName).catch(console.error);
        //             }
        //         });
        //     } catch (error) {
        //         console.log('🚀 ~ execute: ~ error:', error);
        //         await interaction.reply(
        //             'Hubo un error al intentar reproducir el video.',
        //         );
        //         // Intenta eliminar el archivo temporal en caso de error
        //         unlinkAsync(tempFileName).catch(console.error);
        // }
    },
};

async function playSong(client: ExtendedClient, interaction, song: QueueItem) {
    const { url, title } = song;

    // Define el nombre del archivo temporal
    const tempFileName = `temp_audio_${Date.now()}.mp4`;

    try {
        // Descarga el video como audio
        const videoStream = ytdl(url, { filter: 'audioonly' });
        const videoBuffer = await streamToBuffer(videoStream);
        await writeFileAsync(tempFileName, videoBuffer);

        // Reproduce el archivo descargado
        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(tempFileName);
        connection.subscribe(player);
        player.play(resource);

        await interaction.followUp(`Reproduciendo ahora: **${title}**`);

        // Maneja la finalización de la reproducción y la cola
        player.on('stateChange', async (oldState, newState) => {
            if (newState.status === 'idle') {
                unlinkAsync(tempFileName).catch(console.error); // Elimina el archivo temporal
                const nextSong = client.musicQueue.getNextItem();
                if (nextSong) {
                    playSong(client, interaction, nextSong);
                } else {
                    client.musicQueue.playing = false;
                }
            }
        });
    } catch (error) {
        console.error('Error al reproducir el video:', error);
        await interaction.followUp(
            'Hubo un error al intentar reproducir el video.',
        );
        unlinkAsync(tempFileName).catch(console.error); // Intenta eliminar el archivo temporal en caso de error
    }
}

export default play;

// Función auxiliar para convertir un stream a buffer
function streamToBuffer(stream: Readable) {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
