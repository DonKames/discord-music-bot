import "dotenv/config";
import { InstallGlobalCommands } from "../utils/utils.mjs";

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1,
};

const PLAY_COMMAND = {
  name: "play",
  description: "Play a song from a YouTube link",
  type: 1,
  options: [
    {
      name: "link",
      description: "The YouTube link of the song to play.",
      type: 3,
      required: true,
    },
  ],
};

const NEXT_COMMAND = {
  name: "next",
  description: "Next song of the queue.",
  type: 1,
};

const QUEUE_COMMAND = {
  name: "queue",
  description: "Show the queue.",
  type: 1,
};
const PAUSE_COMMAND = {
  name: "pause",
  description: "Pause the current song.",
  type: 1,
};
const CLEAR_COMMAND = {
  name: "clear",
  description: "Clear the queue.",
  type: 1,
};
const STOP_COMMAND = {
  name: "stop",
  description: "Stop the current song.",
  type: 1,
};

const ALL_COMMANDS = [
  TEST_COMMAND,
  PLAY_COMMAND,
  NEXT_COMMAND,
  QUEUE_COMMAND,
  PAUSE_COMMAND,
  CLEAR_COMMAND,
  STOP_COMMAND,
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
