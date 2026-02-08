import TILE_TYPES from './Tiles';
import { MAP_DATA, TILE_SIZE } from '../config/map';
import React from 'react';

const RenderMap = React.memo(({ playerPos }) => {
  const mapHeight = MAP_DATA.length;
  const mapWidth = MAP_DATA[0].length;

  const rows = Math.ceil(window.innerHeight / TILE_SIZE) + 2;
  const cols = Math.ceil(window.innerWidth / TILE_SIZE) + 2;

  const tiles = [];

  for (let y = -1; y < rows; y++) {
    for (let x = -1; x < cols; x++) {
      const worldX = Math.floor((playerPos.x + x * TILE_SIZE) / TILE_SIZE);
      const worldY = Math.floor((playerPos.y + y * TILE_SIZE) / TILE_SIZE);
      
      const tileXIndex = ((worldX % mapWidth) + mapWidth) % mapWidth;
      const tileYIndex = ((worldY % mapHeight) + mapHeight) % mapHeight;
      
      const tileType = MAP_DATA[tileYIndex][tileXIndex];
      const sprite = TILE_TYPES[tileType].src;

      tiles.push(
        <div
          key={`${worldX}-${worldY}`}
          className="absolute border-[0.5px] border-black/5" // Optional: faint grid line
          style={{
            width: TILE_SIZE,
            height: TILE_SIZE,
            left: x * TILE_SIZE - (playerPos.x % TILE_SIZE),
            top: y * TILE_SIZE - (playerPos.y % TILE_SIZE),
            backgroundImage: `url(${sprite})`,
            backgroundSize: 'cover',
            imageRendering: 'pixelated', // Keeps pixel art sharp
          }}
        />
      );
    }
  }

  return <div className="absolute inset-0 overflow-hidden bg-slate-950">{tiles}</div>;
});

export default RenderMap;