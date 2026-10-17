# Duel Disk visual mode

This is a self-contained procedural CSS 3D visual implementation. It requires no paid APIs, third-party 3D model licenses, new dependencies, or changes to the game protocol.

The original Bg and Card components remain the only interactive field. Never duplicate their click handlers in the decorative scene. DuelDiskEffects reads the existing Valtio card store and only renders a presentation pulse on zone transitions. A zone departure is intentionally labelled *CARD DEPARTED*, not *destroyed*, because movement alone does not prove a destruction event.

Controls: Duel Disk / Classic; FX High / Medium / Low. Preferences persist in localStorage when available. Reduced-motion users receive static effects.

This version does **not** contain GLB meshes or true Three.js monsters. The metallic housing and hologram overlays are procedural CSS 3D. A future WebGL renderer can be mounted behind the existing interactive board without changing the duel engine.

Validation before merge: npm ci; npm run build; npm run lint; npm run test:e2e. Test card placement, card selection, multiplayer and replay in both modes. GitHub-only editing cannot execute these tests.
