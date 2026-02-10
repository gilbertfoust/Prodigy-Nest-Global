import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page build so all wings are included in `vite build`.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        hall2d: resolve(__dirname, 'hall2d/index.html'),
        training: resolve(__dirname, 'training/index.html'),
        town: resolve(__dirname, 'town/index.html'),
        hall3dLegacy: resolve(__dirname, 'hall3d/index.html'),
        reader: resolve(__dirname, 'reader/index.html'),
        speak: resolve(__dirname, 'speak/index.html'),
        game: resolve(__dirname, 'game/index.html'),
        heaven: resolve(__dirname, 'heaven/index.html'),
        tsi: resolve(__dirname, 'tsi/index.html'),
        cards: resolve(__dirname, 'cards/index.html'),
        vocab: resolve(__dirname, 'vocab/index.html')
      }
    }
  }
});

