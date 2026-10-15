---
'@kubb/studio': patch
---

Send generation events to Studio while the run is in progress. Plugins that render in memory never gave the event loop a turn, so the agent sent every event at once when the run ended and the Run panel in Studio only updated at the end. The agent now yields after each step event.
