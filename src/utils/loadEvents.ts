import fs from 'fs';
import path from 'path';
import { ExtendedClient } from '../ExtendedClient';

export function loadEvents(client: ExtendedClient) {
    const eventFiles = fs
        .readdirSync(path.join(__dirname, '..', 'events'))
        .filter((file) => file.endsWith('.ts'));

    for (const file of eventFiles) {
        import(path.join(__dirname, '..', 'events', file)).then((event) => {
            if (event.once) {
                client.once(event.name, (...args) =>
                    event.execute(...args, client),
                );
            } else {
                client.on(event.name, (...args) =>
                    event.execute(...args, client),
                );
            }
        });
    }
}
