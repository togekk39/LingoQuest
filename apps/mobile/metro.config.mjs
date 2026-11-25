import { resolve } from 'node:path';
import metro from 'expo/metro-config.js';

const config = metro.getDefaultConfig(import.meta.dirname);
config.watchFolders.push(resolve(import.meta.dirname, '../../content/source/prerequisites'));

export default config;
