# AdaptiveSpace XR

An interactive browser-based 3D room planner for a college project demonstration. It runs on a regular laptop; no VR headset is needed.

## Run on Windows

Open PowerShell in this folder and run:

```powershell
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). To create a production build, run `npm run build`; to serve that build locally, run `npm run preview`.

## Using the designer

- Drag a furniture piece in the 3D scene to move it. Positions snap to a 0.25 m grid.
- Select an item in the left panel or scene, then use its rotate button to rotate it by 45 degrees. Remove and add pieces from the same panels.
- Drag the empty scene to orbit and scroll to zoom. The scene pauses orbit while furniture is being dragged.
- Watch the analysis panel update from the current furniture data. Overlaps and room-boundary violations are shown as issues.
- Choose **Optimize my layout** to run the placement search and open three scored alternatives. Pick one to apply it.
- Export a JSON file containing the room, furniture positions, and computed score.

## Architecture

- `src/main.jsx` mounts the React app and global stylesheet.
- `src/App.jsx` contains the workspace UI, live score panels, furniture catalog, controls, export, and React Three Fiber scene.
- `src/layout.js` owns room/furniture data, footprint geometry, room-boundary and collision checks, metrics, and the layout search.
- `src/styles.css` and `tailwind.config.js` provide the dark Tailwind-enabled UI styling.

## Algorithms to explain

Furniture is represented by a center point, width, depth, height, and angle in metres. The collision and room-edge checks use a rotated rectangle's axis-aligned bounding box. This is easy to explain and slightly conservative around rotated furniture.

The optimizer sorts larger pieces first. For each piece it tests legal positions on a 0.25 m grid and four quarter-turn orientations. It selects the position that gives the best current whole-room score, with a small preference for wall placement and a penalty for blocking the front entry strip. This greedy search is understandable and fast for a small room, though it does not guarantee a mathematically global optimum. Three demo options are made from the best search result: the result, its left-right mirror, and a 180-degree turn. Each option is independently scored against the same rules.

Scores are computed from the scene rather than stored sample values:

- **Space utilization** = total furniture floor footprint ÷ room floor area, capped at 100%.
- **Collision-free** decreases with the number of overlapping furniture pairs.
- **Walking access** starts at 100 and decreases for objects inside the 0.9 m entry walkway.
- **Overall** = 20% utilization + 50% collision-free + 30% walking access, minus 30 points per piece outside the room.

The displayed metrics are design heuristics for the demonstration, not building-code certification. The current room is 8 × 7 m, and the walkway is a fixed front-of-room zone.
