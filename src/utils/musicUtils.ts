import "dotenv/config";

import { CommandInteraction } from "discord.js";
import { VoiceConnection, createAudioResource } from "@discordjs/voice";
import ytdl from "ytdl-core";
import fs from "fs";
import { Readable } from "stream";
import { promisify } from "util";

import { Music, QueueSong } from "./Music";
import { ExtendedClient } from "../ExtendedClient";
import { errorHandler } from "./errorHandler";
import { google } from "googleapis";

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export async function playSong(
  client: ExtendedClient,
  interaction: CommandInteraction,
  connection: VoiceConnection,
  song: QueueSong
) {
  const { url, title } = song;

  try {
    // Descarga el archivo de audio
    const songName = await downloadSong(url);

    // Verifica que el archivo se haya descargado antes de intentar reproducirlo
    if (songName) {
      // Reproduce el archivo descargado
      // const player = createAudioPlayer();
      const musicInstance = Music.getInstance();
      const audioPlayer = musicInstance.audioPlayer!;

      connection.subscribe(audioPlayer);
      const resource = createAudioResource(songName!);
      audioPlayer.play(resource);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(`Reproduciendo ahora: **${title}**`);
      } else {
        await interaction.reply(`Reproduciendo ahora: **${title}**`);
      }

      // Maneja la finalización de la reproducción y la cola
      audioPlayer.on("stateChange", async (oldState, newState) => {
        if (newState.status === "idle") {
          unlinkAsync(songName!).catch(console.error);
          client.music.isPlaying = false;
          const nextSong = client.music.queue.getNextItem();
          if (nextSong) {
            playSong(client, interaction, connection, nextSong);
          }
        }
      });
    } else {
      throw new Error("Error al descargar el archivo de audio.");
    }
  } catch (error) {
    errorHandler(error, interaction);
  }
}

export async function downloadSong(url: string) {
  try {
    // Define el nombre del archivo temporal
    const tempFileName = `temp_audio_${Date.now()}.mp4`;

    // Descarga el video como audio
    const videoStream = ytdl(url, { filter: "audioonly" });
    const videoBuffer = await streamToBuffer(videoStream);
    await writeFileAsync(tempFileName, videoBuffer);

    // Devuelve el nombre del archivo temporal
    return tempFileName;
  } catch (error) {
    console.error("Error al descargar el video:", error);

    return null;
  }
}

// Función auxiliar para convertir un stream a buffer
export function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// Función para pausar la canción actual
export function pauseSong(interaction: CommandInteraction) {
  // Pausa el AudioPlayer si está reproduciendo
  try {
    const music = Music.getInstance();

    if (!music.isPlaying) {
      interaction.reply("No hay canciones reproduciéndose.");
      return;
    }
  } catch (error) {}
}

// Función para obtener info de la canción y preparar el QueueSong
/**
 * The function `fetchSongInfo` fetches information about a song from a given link and returns a
 * `QueueSong` object or null.
 * @param {string} link - The `link` parameter is a string that represents the URL of a video that you
 * want to fetch information for.
 * @param {CommandInteraction} interaction - The `interaction` parameter in the `fetchSongInfo`
 * function is of type `CommandInteraction`. This parameter likely represents an interaction with a
 * command in a Discord bot application. It can be used to access information about the interaction,
 * such as the user who triggered the command, the channel where the command
 * @returns The `fetchSongInfo` function returns a Promise that resolves to either a `QueueSong` object
 * containing the title and URL of the song, or `null` if there was an error or if the video
 * information could not be obtained.
 */
export async function fetchSongInfo(
  link: string,
  interaction: CommandInteraction
): Promise<QueueSong | null> {
  try {
    const videoInfo = await ytdl.getInfo(link);
    const videoTitle = videoInfo.videoDetails.title;

    if (!videoInfo || !videoTitle) {
      await interaction.followUp(
        "No se pudo obtener la información del video."
      );
      return null;
    }

    const song: QueueSong = {
      title: videoTitle,
      url: link,
    };

    return song;
  } catch (error) {
    console.log("🚀 ~ fetchSongInfo ~ error:", error);
    return null;
  }
}

export function extractPlaylistId(url: string): string | null {
  const regex = /[&?]list=([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);

  return match ? match[1] : null;
}

export async function fetchPlaylistSongs(
  playlistUrl: string
): Promise<QueueSong[]> {
  try {
    const playlistId = extractPlaylistId(playlistUrl);

    if (!playlistId) {
      return [];
    }

    const auth = process.env.YOUTUBE_KEY;
    console.log("🚀 ~ auth:", auth);

    const youtube = google.youtube({
      version: "v3",
      auth,
    });

    let nextPageToken: string | undefined;

    const songs: QueueSong[] = [];

    do {
      const response = await youtube.playlistItems.list({
        playlistId,
        part: ["snippet"],
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const items = response.data.items;
      if (items) {
        for (const item of items) {
          const title = item.snippet?.title;
          const videoId = item.snippet?.resourceId?.videoId;

          if (title && videoId) {
            songs.push({
              title,
              url: `https://www.youtube.com/watch?v=${videoId}`,
            });
          }
        }
      }

      nextPageToken = response.data.nextPageToken!;
    } while (nextPageToken);

    return songs;
  } catch (error) {
    console.log(
      "🚀 ~ Error al obtener las canciones de la lista de reproducción:",
      error
    );
    return [];
  }
}
