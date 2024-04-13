import { CommandInteraction } from "discord.js";
import {
  VoiceConnection,
  createAudioPlayer,
  createAudioResource,
} from "@discordjs/voice";
import ytdl from "ytdl-core";
import fs from "fs";
import { Readable } from "stream";
import { promisify } from "util";

import { QueueItem } from "./MusicQueue";
import { ExtendedClient } from "../ExtendedClient";

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

// Función auxiliar para convertir un stream a buffer
export function streamToBuffer(stream: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function playSong(
  client: ExtendedClient,
  interaction: CommandInteraction,
  connection: VoiceConnection,
  song: QueueItem
) {
  const { url, title } = song;

  try {
    const songName = await downloadSong(url);

    // Reproduce el archivo descargado
    const player = createAudioPlayer();
    const resource = createAudioResource(songName!);
    connection.subscribe(player);
    player.play(resource);

    await interaction.reply(`Reproduciendo ahora: **${title}**`);

    // Maneja la finalización de la reproducción y la cola
    player.on("stateChange", async (oldState, newState) => {
      if (newState.status === "idle") {
        unlinkAsync(songName!).catch(console.error);
        client.musicQueue.playing = false;
        const nextSong = client.musicQueue.getNextItem();
        if (nextSong) {
          playSong(client, interaction, connection, nextSong);
        }
      }
    });
  } catch (error) {
    console.error("Error al reproducir el video:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(
        "Hubo un error al intentar reproducir el video."
      );
    } else {
      await interaction.reply(
        "Hubo un error al intentar reproducir el video?."
      );
      console.error("La interacción ya ha sido respondida previamente.");
    }
  }
}

export async function downloadSong(url: string) {
  // Define el nombre del archivo temporal
  const tempFileName = `temp_audio_${Date.now()}.mp4`;

  try {
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
