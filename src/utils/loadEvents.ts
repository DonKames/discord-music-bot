import fs from "fs";
import path from "path";
import { ExtendedClient } from "../ExtendedClient";

export function loadEvents(client: ExtendedClient) {
  const eventFiles = fs
    .readdirSync(path.join(__dirname, "..", "events"))
    .filter((file) => file.endsWith(".ts"));

  for (const file of eventFiles) {
    import(path.join(__dirname, "..", "events", file)).then((eventModule) => {
      // Si el módulo tiene una única exportación (lo más común)
      const event = eventModule.default || Object.values(eventModule)[0];

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      console.log(`Cargado evento: ${event.name}`);
    });
  }
}
