import 'dotenv/config';
import { InstallGlobalCommands } from '../utils/utils.js';

// Simple test command
const TEST_COMMAND = {
    name: 'test',
    description: 'Basic command',
    type: 1,
};

const PLAY_COMMAND = {
    name: 'play',
    description: 'Play a song',
    type: 1,
};

const ALL_COMMANDS = [TEST_COMMAND, PLAY_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
