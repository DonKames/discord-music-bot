import {
  AudioPlayer,
  AudioPlayerState,
  createAudioPlayer,
} from "@discordjs/voice";
import { ExtendedClient } from "../ExtendedClient";
import { CommandInteraction } from "discord.js";
import fs from "fs";
import { promisify } from "util";
import { errorHandler } from "./errorHandler";
import {
  createAudioPlayerAndPlay,
  downloadSong,
  joinChannel,
} from "./musicUtils";

export interface QueueSong {
  url: string;
  title: string;
}

class Queue {
  public songs: QueueSong[] = [];
  public isPaused: Boolean = true;

  constructor() {
    this.songs = [];
  }

  clearQueue() {
    this.songs = [];
  }

  addToQueue(item: QueueSong) {
    this.songs.push(item);
  }

  getNextItem(): QueueSong | undefined {
    return this.songs.shift();
  }

  pause() {
    // Pause the current song
    this.isPaused = !this.isPaused;
  }
}

export class Music {
  private static instance: Music | null = null;
  public queue: Queue = new Queue();
  public isPlaying: boolean = false;
  public audioPlayer: AudioPlayer | null = null;

  private songFileName: string | null = null;
  private client: ExtendedClient | null = null;
  private interaction: CommandInteraction | null = null;
  private unlinkAsync = promisify(fs.unlink);

  private constructor() {
    this.audioPlayer = createAudioPlayer();

    this.audioPlayer.on(
      "stateChange",
      async (oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (newState.status === "idle") {
          if (this.songFileName && fs.existsSync(this.songFileName)) {
            await this.unlinkAsync(this.songFileName).catch(console.error);
          }

          this.isPlaying = false;

          if (this.client) {
            this.playSong(this.client, this.interaction!);
          }
        }
      }
    );
  }

  public setPlaybackContext(
    songFileName: string,
    client: ExtendedClient,
    interaction: CommandInteraction
  ) {
    this.songFileName = songFileName;
    this.client = client;
    this.interaction = interaction;
  }

  public static getInstance(): Music {
    if (!Music.instance) {
      Music.instance = new Music();
    }

    return Music.instance;
  }

  public playSong(client: ExtendedClient, interaction: CommandInteraction) {
    const song = client.music.queue.getNextItem();

    if (song) {
      // Crear recurso y reproducir usando audioPlayer
      this.isPlaying = true;
      this.downloadAndPlay(song, client, interaction);
      if (interaction.replied || interaction.deferred) {
        interaction.followUp(`Reproduciendo ahora: ${song.url}`);
      } else {
        interaction.reply(`Reproduciendo ahora: ${song.url}`);
      }
    } else {
      if (interaction.replied || interaction.deferred) {
        interaction.followUp("No hay más canciones en la cola");
      } else {
        interaction.reply("No hay más canciones en la cola");
      }
    }
  }

  private async downloadAndPlay(
    song: QueueSong,
    client: ExtendedClient,
    interaction: CommandInteraction
  ) {
    try {
      const songFileName = await downloadSong(song.url);

      if (songFileName) {
        this.setPlaybackContext(songFileName, client, interaction);

        const connection = await joinChannel(interaction);
        createAudioPlayerAndPlay(songFileName, client, connection);
      } else {
        throw new Error("No se pudo descargar la canción");
      }
    } catch (error) {
      console.log("🚀 ~ Music ~ downloadAndPlay ~ error:", error);
      errorHandler(error, interaction);
    }
  }
}
