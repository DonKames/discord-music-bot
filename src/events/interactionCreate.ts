import { CommandInteraction, Events, Interaction } from "discord.js";
import { ExtendedClient } from "../ExtendedClient"; // Ajusta la ruta si es necesario
import { fetchSongInfo } from "../utils/musicUtils";
import { QueueSong } from "../utils/Music";

export const interactionCreate = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, client: ExtendedClient) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isStringSelectMenu()) {
      const music = client.music;

      // Manejo de interacciones con el menú de selección
      const selectedValue = interaction.values[0];
      const videoUrl = selectedValue;

      const songInfo = await fetchSongInfo(videoUrl);
      if (!songInfo) {
        await interaction.followUp(
          `Hubo un error al recuperar la información de la canción`
        );
        return;
      }
      const song: QueueSong = songInfo;

      // Aquí puedes agregar la lógica para manejar el video seleccionado
      await interaction.reply(`Seleccionaste el video: ${videoUrl}`);
      if (music.isPlaying) {
        music.queue.addToQueue(song);
        await interaction.reply(`Añadido a la cola: **${song.title}**`);
      } else {
        music.queue.addToQueue(song);

        music.playSong(client, interaction as unknown as CommandInteraction);
      }
    }
  },
};
