# 3D Tube Tetris

A 3D Tetris-like puzzle game where traditional Tetris pieces (tetrominoes) fall and stack around the surface of a cylindrical tube instead of a flat 2D plane. Built with Three.js and TypeScript.

## Project Structure

```
3d-tube-tetris/
├── src/
│   ├── types/           # TypeScript interfaces and enums
│   ├── main.ts          # Main entry point
│   └── setupTests.ts    # Jest test configuration
├── index.html           # Main HTML file
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
├── jest.config.js       # Jest testing configuration
└── README.md           # This file
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Technologies Used

- **Three.js**: 3D graphics rendering
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **Jest**: Testing framework

## Game Concept

The game features:
- 3D cylindrical tube instead of traditional 2D grid
- Tetrominoes fall vertically while maintaining horizontal orientation
- Tube rotates to position pieces
- Complete rings around the tube circumference clear like traditional Tetris lines
- Progressive difficulty with increasing fall speed

## Controls

- **← →**: Rotate tube left/right
- **↓**: Soft drop (faster falling)
- **Space**: Hard drop (instant drop)
- **↑**: Rotate current piece
- **P**: Pause/unpause game