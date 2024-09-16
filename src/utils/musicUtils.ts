import "dotenv/config";

import { CommandInteraction } from "discord.js";
import {
  createAudioResource,
  joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import { Readable } from "stream";
import { promisify } from "util";

import { Music, QueueSong } from "./Music";
import { ExtendedClient } from "../ExtendedClient";
import { google } from "googleapis";
import { validateInteractionGuildAndMember } from "./interactionUtils";

const writeFileAsync = promisify(fs.writeFile);

export async function joinChannel(
  interaction: CommandInteraction
): Promise<VoiceConnection> {
  // Valida si el miembro está en un canal de voz y si interaction.member, interaction.guild y interaction.guildId no son nulos
  const member = await validateInteractionGuildAndMember(interaction);

  const connection: VoiceConnection = joinVoiceChannel({
    channelId: member.voice.channelId,
    guildId: interaction.guildId!,
    adapterCreator: interaction.guild?.voiceAdapterCreator!,
  });

  return connection;
}

export async function createAudioPlayerAndPlay(
  songFileName: string,
  client: ExtendedClient,
  connection: VoiceConnection
) {
  // Reproduce el archivo descargado
  const musicInstance = Music.getInstance();
  const audioPlayer = musicInstance.audioPlayer!;

  connection.subscribe(audioPlayer);
  const resource = createAudioResource(songFileName!);
  audioPlayer.play(resource);
  client.music.isPlaying = true;
}

export async function downloadSong(url: string) {
  console.log("🚀 ~ downloadSong ~ url:", url);
  try {
    // Define el nombre del archivo temporal
    const tempFileName = `temp_audio_${Date.now()}.mp4`;

    // Descarga el video como audio
    const videoStream = ytdl(url, {
      filter: "audioonly",
    });

    videoStream.on("error", (err) => {
      console.error("Error en el stream de video:", err);
    });

    const videoBuffer = await streamToBuffer(videoStream);
    await writeFileAsync(tempFileName, videoBuffer);

    // Devuelve el nombre del archivo temporal
    return tempFileName;
  } catch (error) {
    // Verificación de tipo para asegurar que `error` es de tipo `Error`
    if (error instanceof Error) {
      console.error("Error al descargar el video con detalles:", {
        // message: error.message,
        stack: error.stack,
        ...error,
      });
    } else {
      console.error("Error desconocido al descargar el video:", error);
    }

    return null;
  }
}

// Función auxiliar para convertir un stream a buffer
export function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    } catch (error) {
      console.log("🚀 ~ streamToBuffer ~ error:", error);
    }
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
export async function fetchSongInfo(link: string): Promise<QueueSong | null> {
  try {
    const videoInfo = await ytdl.getInfo(link);
    const videoTitle = videoInfo.videoDetails.title;

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

    const youtube = google.youtube({
      version: "v3",
      auth,
    });

    let nextPageToken: string | undefined;

    const songs: QueueSong[] = [];

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

    return songs;
  } catch (error) {
    console.log(
      "🚀 ~ Error al obtener las canciones de la lista de reproducción:",
      error
    );
    return [];
  }
}
