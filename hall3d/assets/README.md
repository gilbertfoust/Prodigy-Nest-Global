# hall3d assets

This folder is intentionally empty in git (placeholders-first workflow).

## Player character (GLB)

Add **one** rigged GLB here (first one found is loaded):

1. `character.glb`
2. `player.glb`
3. `avatar.glb`

### Recommended source

- Mixamo-exported character (GLB/GLTF) with animations.

### Recommended animation names

The hall loader auto-maps common names:

- Idle: `Idle`, `Stand`, `Breath`, `Rest`
- Walk: `Walk`, `Run`, `Jog`

If exact names differ, the loader falls back to the first available clip.

### Runtime behavior

- Character is auto-scaled to fit hall proportions.
- If no supported GLB exists, the app uses a capsule placeholder character.
