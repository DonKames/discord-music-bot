import 'dotenv/config';
import express from 'express';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

const activeConnections = {};

app.post('/interactions', async (req, res) => {
    const { type, data, guild_id, member } = req.body;

    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        if (name === 'play') {
        }
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
