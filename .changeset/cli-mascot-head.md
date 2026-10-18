---
'@kubb/cli': patch
---

Open `kubb generate` with the hooded Kubb head as pixel art that blinks and looks around once, then rests while the config loads.

- Draws the mascot in fixed 256-color codes, so terminal themes no longer recolor it.
- Keeps the plain `Kubb CLI vX` line in CI, for AI agents, and in terminals without 256 colors.
