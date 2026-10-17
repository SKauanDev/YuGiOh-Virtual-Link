# Duel Disk 3D asset integration

The visual mode now embeds a real artist-made Yu-Gi-Oh Duel Disk via the official Sketchfab viewer, instead of a procedural SVG/CSS replica.

- Model: https://sketchfab.com/3d-models/yu-gi-oh-duel-disk-88dc1d9075504d04a8ce506030189304
- Creator: ELATTAR Ayoub
- Listing license: Creative Commons Attribution (CC BY); retain visible creator/source credit.
- Viewer: https://sketchfab.com/developers/viewer
- Original game zone DOM, card interactions, multiplayer and rules are untouched.

IMPORTANT: This is a hosted iframe visualization, not a locally loaded GLB and not yet an interactive, rigged game mesh. The Sketchfab iframe is deliberately non-interactive to avoid stealing game clicks. The original rectangular game-zone layout remains overlaid and will need a dedicated zone-coordinate adapter and an appropriately rigged local model before a complete physical Duel Disk board is achieved. It requires network access to Sketchfab and may be blocked by privacy settings or CSP. Model iframe onError does not catch all blocked-embed failures.

Sketchfab's Download API requires account OAuth; do not hardcode a token or hotlink temporary archive URLs. To implement a locally hosted GLB, obtain the model through an authorized account, retain its license and attribution, optimize it, and load with Three.js/GLTFLoader. Do not claim this embed is a fully integrated Three.js model.

Validation required before merge: npm install; npm run build; npm run lint; npm run test:e2e; check embed availability, CSP, all card clicks, zones, multiplayer and classic mode. These checks have not been run by the GitHub-only editing environment.
