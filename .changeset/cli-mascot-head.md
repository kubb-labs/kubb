---
'@kubb/cli': patch
---

Open `kubb generate` with the Kubb mascot, a kid in an orange hoodie drawn as pixel art, who blinks and looks around once, then rests while the config loads.

- Draws the mascot in fixed 256-color codes, so terminal themes no longer recolor it.
- Keeps the plain `Kubb CLI vX` line in CI, for AI agents, and in terminals that are too narrow or lack 256 colors.
