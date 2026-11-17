// Sizzle & Serve — entry program for the make.fun best-game-01 bounty.
// Node 22+, standard library only. It hands the game in: copies the static
// game/ folder and the screenshots/ folder from beside this file into the
// output directory, then writes /output/dossier.json with the kit's
// buildDossier library, exactly the summary the judge reads.
//
// The grader runs this twice in a fresh container with no network and
// requires both runs to write identical bytes, so this program does nothing
// but copy files and build the dossier — no timestamps, no randomness.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the kit's reference/gate.json: only text_max_bytes
// shapes the dossier's bytes; the others refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; game/ over 993 files
// or 48 MiB, or a path under game/ over 1000 bytes).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
