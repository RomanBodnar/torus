# Essential Tetris Game Mechanics and Mathematics

This document outlines the core mechanics and mathematical concepts needed to implement a Tetris game, including our 3D tube variant.

## Core Game Mechanics

### 1. **Grid System**
- **2D Array**: Represents the playing field (typically 10 wide × 20 tall)
- **Cell States**: Empty (0) or occupied (piece type/color)
- **Bounds Checking**: Ensure pieces stay within grid boundaries

### 2. **Piece Movement & Rotation**
- **Translation**: Moving pieces left/right/down
- **Rotation**: 90-degree clockwise/counterclockwise turns
- **Collision Detection**: Check if movement/rotation is valid
- **Lock Mechanism**: When piece can't move down, it locks in place

### 3. **Line Clearing**
- **Complete Line Detection**: Check if entire row is filled
- **Line Removal**: Delete completed lines
- **Gravity**: Drop remaining blocks down to fill gaps
- **Multiple Line Clearing**: Handle 1-4 lines simultaneously (Tetris!)

### 4. **Piece Generation**
- **7-Bag System**: Shuffle all 7 pieces, deal them out, repeat
- **Next Piece Preview**: Show upcoming piece(s)
- **Spawn Position**: Center-top of grid

## Essential Math

### 1. **Coordinate Systems**

Tetris uses two coordinate systems that need to be converted between each other:

```typescript
// Grid coordinates (discrete) - represents logical game positions
// Origin (0,0) is typically top-left of the playing field
// x increases rightward, y increases downward
interface GridPos { 
  x: number; // Column index (0 to GRID_WIDTH-1)
  y: number; // Row index (0 to GRID_HEIGHT-1)
}

// World coordinates (continuous) - represents pixel positions for rendering
// Used by the graphics engine for actual drawing positions
interface WorldPos { 
  x: number; // Pixel position horizontally
  y: number; // Pixel position vertically
}

/**
 * Convert grid position to world coordinates for rendering
 * Mathematical transformation: world = grid * cellSize + offset
 * 
 * @param grid - Discrete grid position
 * @param cellSize - Size of each grid cell in pixels
 * @param offset - World space offset (for centering, margins, etc.)
 * @returns World position in pixels
 */
function gridToWorld(grid: GridPos, cellSize: number, offset: WorldPos): WorldPos {
  return {
    x: grid.x * cellSize + offset.x,
    y: grid.y * cellSize + offset.y
  };
}

/**
 * Convert world coordinates back to grid position
 * Mathematical transformation: grid = floor((world - offset) / cellSize)
 * 
 * @param world - Continuous world position
 * @param cellSize - Size of each grid cell in pixels
 * @param offset - World space offset
 * @returns Discrete grid position
 */
function worldToGrid(world: WorldPos, cellSize: number, offset: WorldPos): GridPos {
  return {
    x: Math.floor((world.x - offset.x) / cellSize),
    y: Math.floor((world.y - offset.y) / cellSize)
  };
}
```

### 2. **Rotation Mathematics**

Tetris pieces rotate in 90-degree increments. We use 2D rotation matrices for this transformation.

**Mathematical Background:**
The standard 2D rotation matrix for angle θ is:
```
[cos(θ)  -sin(θ)]
[sin(θ)   cos(θ)]
```

For 90° clockwise rotation (θ = -π/2):
- cos(-π/2) = 0, sin(-π/2) = -1
- Matrix becomes: [0, 1; -1, 0]
- Transformation: (x,y) → (y, -x)

```typescript
/**
 * Rotate a point 90 degrees clockwise around origin
 * Uses simplified rotation matrix for 90° increments
 * 
 * Mathematical derivation:
 * - 90° clockwise = -90° = -π/2 radians
 * - Rotation matrix: [0, 1; -1, 0]
 * - (x,y) * matrix = (y, -x)
 * 
 * @param x - X coordinate relative to rotation center
 * @param y - Y coordinate relative to rotation center
 * @returns Rotated coordinates [newX, newY]
 */
function rotatePoint90Clockwise(x: number, y: number): [number, number] {
  return [y, -x];
}

/**
 * Rotate a point 90 degrees counterclockwise around origin
 * 
 * Mathematical derivation:
 * - 90° counterclockwise = π/2 radians
 * - Rotation matrix: [0, -1; 1, 0]
 * - (x,y) * matrix = (-y, x)
 */
function rotatePoint90CounterClockwise(x: number, y: number): [number, number] {
  return [-y, x];
}

/**
 * General rotation function for arbitrary angles
 * Uses full 2D rotation matrix - not typically needed for Tetris
 * but useful for smooth animations or 3D rotations
 * 
 * @param x - X coordinate
 * @param y - Y coordinate  
 * @param angle - Rotation angle in radians
 * @returns Rotated coordinates [newX, newY]
 */
function rotatePointByAngle(x: number, y: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x * cos - y * sin,  // New X = x*cos(θ) - y*sin(θ)
    x * sin + y * cos   // New Y = x*sin(θ) + y*cos(θ)
  ];
}

/**
 * Rotate a tetromino piece around its center point
 * Handles the offset to rotation center and back
 * 
 * @param piece - Tetromino with block positions
 * @param clockwise - Direction of rotation
 * @returns New piece with rotated block positions
 */
function rotateTetromino(piece: TetrominoShape, clockwise: boolean = true): TetrominoShape {
  // Find the center point (usually [1.5, 1.5] for 4x4 bounding box)
  const centerX = 1.5;
  const centerY = 1.5;
  
  const rotatedBlocks = piece.blocks.map(block => {
    // Translate to origin (center at 0,0)
    const relativeX = block.x - centerX;
    const relativeY = block.y - centerY;
    
    // Rotate around origin
    const [newX, newY] = clockwise 
      ? rotatePoint90Clockwise(relativeX, relativeY)
      : rotatePoint90CounterClockwise(relativeX, relativeY);
    
    // Translate back to original center
    return {
      x: newX + centerX,
      y: newY + centerY
    };
  });
  
  return { ...piece, blocks: rotatedBlocks };
}
```

### 3. **Collision Detection**

Collision detection determines if a piece can be placed at a given position without overlapping boundaries or existing blocks.

**Algorithm Complexity:** O(n) where n is the number of blocks in the piece (always 4 for Tetris)

```typescript
/**
 * Check if a tetromino piece can be placed at its current position
 * Tests both boundary conditions and collisions with existing blocks
 * 
 * Mathematical approach:
 * 1. Transform each block's local coordinates to world coordinates
 * 2. Check if world coordinates are within grid boundaries
 * 3. Check if grid cell at world coordinates is empty
 * 
 * @param piece - Tetromino piece with position and block layout
 * @param grid - 2D array representing the game field (0 = empty, >0 = occupied)
 * @returns true if position is valid, false if collision detected
 */
function isValidPosition(piece: Tetromino, grid: number[][]): boolean {
  // Check each block of the tetromino
  for (const block of piece.blocks) {
    // Transform local block coordinates to world grid coordinates
    // World position = piece position + block offset
    const worldX = piece.x + block.x;
    const worldY = piece.y + block.y;
    
    // Boundary collision detection
    // Left/right boundaries
    if (worldX < 0 || worldX >= GRID_WIDTH) {
      return false; // Block is outside horizontal boundaries
    }
    
    // Top boundary (pieces can spawn above grid)
    // Bottom boundary  
    if (worldY >= GRID_HEIGHT) {
      return false; // Block is below the bottom
    }
    
    // Allow pieces to be above the grid during spawn
    if (worldY < 0) {
      continue; // Skip blocks above the grid
    }
    
    // Block collision detection
    // Check if the grid cell is already occupied
    if (grid[worldY][worldX] !== 0) {
      return false; // Collision with existing block
    }
  }
  
  return true; // No collisions detected
}

/**
 * Optimized collision detection for specific movement types
 * Avoids recalculating all blocks when only testing one direction
 */
function canMoveLeft(piece: Tetromino, grid: number[][]): boolean {
  const testPiece = { ...piece, x: piece.x - 1 };
  return isValidPosition(testPiece, grid);
}

function canMoveRight(piece: Tetromino, grid: number[][]): boolean {
  const testPiece = { ...piece, x: piece.x + 1 };
  return isValidPosition(testPiece, grid);
}

function canMoveDown(piece: Tetromino, grid: number[][]): boolean {
  const testPiece = { ...piece, y: piece.y + 1 };
  return isValidPosition(testPiece, grid);
}

/**
 * Advanced collision detection with wall kick support
 * Tries multiple offset positions when rotation fails
 * 
 * Wall kick offsets for different rotation states (SRS - Super Rotation System)
 */
const WALL_KICK_OFFSETS = {
  // Offsets to try when rotating from 0° to 90°
  '0->90': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  // Offsets to try when rotating from 90° to 180°  
  '90->180': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  // ... more rotation states
};

function canRotateWithWallKick(piece: Tetromino, grid: number[][], clockwise: boolean): boolean {
  const rotatedPiece = rotateTetromino(piece, clockwise);
  const offsetKey = getRotationKey(piece.rotation, clockwise);
  
  // Try each wall kick offset
  for (const [offsetX, offsetY] of WALL_KICK_OFFSETS[offsetKey]) {
    const testPiece = {
      ...rotatedPiece,
      x: piece.x + offsetX,
      y: piece.y + offsetY
    };
    
    if (isValidPosition(testPiece, grid)) {
      return true; // Found valid position with wall kick
    }
  }
  
  return false; // No valid wall kick position found
}
```

### 4. **Timing & Game Loop**

Tetris timing controls the game's difficulty progression and responsive controls.

**Mathematical Models:**
- **Linear Progression:** Simple arithmetic progression for fall speed
- **Exponential Decay:** More realistic difficulty curve
- **Frame-based vs Time-based:** Consistent gameplay across different frame rates

```typescript
/**
 * Calculate fall interval using linear progression
 * Mathematical model: interval = max(minimum, base - (level * decrement))
 * 
 * This creates a linear difficulty increase where each level reduces
 * fall time by a fixed amount until reaching minimum speed.
 * 
 * @param level - Current game level (0-based)
 * @param baseInterval - Starting fall interval in milliseconds
 * @param decrement - Time reduction per level
 * @param minInterval - Minimum fall interval (speed cap)
 * @returns Fall interval in milliseconds
 */
function calculateFallInterval(
  level: number, 
  baseInterval: number = 1000, 
  decrement: number = 50, 
  minInterval: number = 50
): number {
  return Math.max(minInterval, baseInterval - (level * decrement));
}

/**
 * Calculate fall interval using exponential decay (more realistic)
 * Mathematical model: interval = base * (decay_rate ^ level)
 * 
 * This creates a more natural difficulty curve where early levels
 * have moderate increases, but higher levels become very challenging.
 * 
 * @param level - Current game level
 * @param baseInterval - Starting fall interval
 * @param decayRate - Exponential decay factor (0 < rate < 1)
 * @returns Fall interval in milliseconds
 */
function calculateFallIntervalExponential(
  level: number,
  baseInterval: number = 1000,
  decayRate: number = 0.9
): number {
  return Math.max(50, baseInterval * Math.pow(decayRate, level));
}

/**
 * Soft drop mechanics - player-controlled faster falling
 * 
 * When player holds down key, piece falls faster but still maintains
 * discrete grid movement (not continuous falling).
 */
const SOFT_DROP_MULTIPLIER = 0.1; // 10x faster falling
const HARD_DROP_SPEED = 0; // Instant drop

function getSoftDropInterval(normalInterval: number): number {
  return normalInterval * SOFT_DROP_MULTIPLIER;
}

/**
 * Lock delay system - prevents immediate locking when piece hits bottom
 * Gives player time to slide piece or rotate before it locks in place
 * 
 * Mathematical approach:
 * - Reset timer when piece moves successfully
 * - Lock piece when timer expires AND piece can't move down
 * - Some implementations use "infinity" - unlimited moves until timer expires
 */
class LockDelaySystem {
  private lockTimer: number = 0;
  private readonly LOCK_DELAY = 500; // milliseconds
  private readonly MAX_RESETS = 15; // Prevent infinite stalling
  private resetCount: number = 0;
  
  /**
   * Update the lock delay timer
   * @param deltaTime - Time elapsed since last update
   * @param pieceMoved - Whether the piece moved this frame
   * @returns true if piece should lock
   */
  update(deltaTime: number, pieceMoved: boolean): boolean {
    if (pieceMoved && this.resetCount < this.MAX_RESETS) {
      // Reset timer when piece moves (with limit to prevent stalling)
      this.lockTimer = 0;
      this.resetCount++;
      return false;
    }
    
    this.lockTimer += deltaTime;
    return this.lockTimer >= this.LOCK_DELAY;
  }
  
  reset(): void {
    this.lockTimer = 0;
    this.resetCount = 0;
  }
}

/**
 * Frame-rate independent timing system
 * Ensures consistent gameplay regardless of display refresh rate
 */
class GameTimer {
  private accumulator: number = 0;
  private readonly targetFrameTime: number;
  
  constructor(targetFPS: number = 60) {
    this.targetFrameTime = 1000 / targetFPS; // Convert to milliseconds
  }
  
  /**
   * Update game logic with fixed timestep
   * Uses accumulator pattern to maintain consistent physics
   * 
   * @param deltaTime - Real time elapsed since last frame
   * @param updateCallback - Function to call for each logic update
   */
  update(deltaTime: number, updateCallback: () => void): void {
    this.accumulator += deltaTime;
    
    // Process fixed timesteps
    while (this.accumulator >= this.targetFrameTime) {
      updateCallback();
      this.accumulator -= this.targetFrameTime;
    }
  }
}

/**
 * Input handling with repeat rates
 * Implements delayed auto-repeat (DAS) and auto-repeat rate (ARR)
 */
class InputTimer {
  private readonly DAS = 167; // Delayed Auto Shift - initial delay in ms
  private readonly ARR = 33;  // Auto Repeat Rate - repeat interval in ms
  
  private keyHoldTime: number = 0;
  private lastRepeatTime: number = 0;
  
  /**
   * Check if input should trigger based on timing
   * @param deltaTime - Time since last update
   * @param keyPressed - Whether key is currently pressed
   * @returns true if action should trigger
   */
  shouldTrigger(deltaTime: number, keyPressed: boolean): boolean {
    if (!keyPressed) {
      this.keyHoldTime = 0;
      this.lastRepeatTime = 0;
      return false;
    }
    
    this.keyHoldTime += deltaTime;
    
    // Initial press
    if (this.keyHoldTime <= deltaTime) {
      return true;
    }
    
    // After DAS delay, start repeating at ARR rate
    if (this.keyHoldTime >= this.DAS) {
      this.lastRepeatTime += deltaTime;
      if (this.lastRepeatTime >= this.ARR) {
        this.lastRepeatTime = 0;
        return true;
      }
    }
    
    return false;
  }
}
```

### 5. **Scoring Mathematics**

Tetris scoring rewards efficient play with exponential bonuses for clearing multiple lines simultaneously.

**Mathematical Principles:**
- **Exponential Rewards:** Clearing 4 lines gives 30x more points than clearing 1 line
- **Level Multiplier:** Higher levels provide linear score multiplication
- **Combo Systems:** Consecutive line clears can provide additional bonuses

```typescript
/**
 * Standard Tetris scoring system (Nintendo guidelines)
 * 
 * Mathematical progression:
 * - Single (1 line): 40 points
 * - Double (2 lines): 100 points (2.5x single)
 * - Triple (3 lines): 300 points (7.5x single) 
 * - Tetris (4 lines): 1200 points (30x single)
 * 
 * The exponential increase encourages players to set up Tetris clears
 * rather than clearing lines individually.
 * 
 * @param linesCleared - Number of lines cleared simultaneously (0-4)
 * @param level - Current game level (affects multiplier)
 * @returns Points awarded for this line clear
 */
function calculateLineScore(linesCleared: number, level: number): number {
  // Base scores for different line clear types
  const BASE_SCORES = [
    0,    // 0 lines - no score
    40,   // Single
    100,  // Double  
    300,  // Triple
    1200  // Tetris (4 lines)
  ];
  
  if (linesCleared < 0 || linesCleared >= BASE_SCORES.length) {
    return 0;
  }
  
  // Score = base_score * (level + 1)
  // Level starts at 0, so we add 1 to avoid zero multiplication
  return BASE_SCORES[linesCleared] * (level + 1);
}

/**
 * Soft drop scoring - points for manually dropping pieces faster
 * Encourages active play rather than waiting for natural fall
 * 
 * @param cellsDropped - Number of grid cells the piece was soft-dropped
 * @returns Points awarded (1 point per cell)
 */
function calculateSoftDropScore(cellsDropped: number): number {
  return cellsDropped; // 1 point per cell dropped
}

/**
 * Hard drop scoring - points for instantly dropping pieces
 * Higher reward than soft drop to encourage decisive play
 * 
 * @param cellsDropped - Number of grid cells the piece was hard-dropped
 * @returns Points awarded (2 points per cell)
 */
function calculateHardDropScore(cellsDropped: number): number {
  return cellsDropped * 2; // 2 points per cell dropped
}

/**
 * Level progression calculation
 * Traditional Tetris increases level every 10 lines cleared
 * 
 * Mathematical model: level = floor(total_lines / lines_per_level)
 * 
 * @param totalLinesCleared - Cumulative lines cleared in game
 * @param linesPerLevel - Lines required to advance level (default: 10)
 * @returns Current level (0-based)
 */
function calculateLevel(totalLinesCleared: number, linesPerLevel: number = 10): number {
  return Math.floor(totalLinesCleared / linesPerLevel);
}

/**
 * Advanced scoring with T-Spin bonuses
 * T-Spins are special moves where T-pieces are rotated into tight spaces
 * 
 * T-Spin detection algorithm:
 * 1. Last action was a T-piece rotation
 * 2. T-piece is in a position where 3+ corners are blocked
 * 3. The rotation was only possible due to wall kick
 */
function calculateTSpinScore(linesCleared: number, level: number, tSpinType: 'mini' | 'normal'): number {
  const T_SPIN_SCORES = {
    mini: [100, 200, 400],      // T-Spin Mini: 0, 1, 2 lines
    normal: [400, 800, 1200]    // T-Spin: 0, 1, 2 lines  
  };
  
  const baseScore = T_SPIN_SCORES[tSpinType][linesCleared] || 0;
  return baseScore * (level + 1);
}

/**
 * Combo system - bonus for consecutive line clears
 * Each consecutive line clear increases the combo multiplier
 * 
 * Mathematical progression: combo_bonus = combo_count * 50 * (level + 1)
 */
class ComboSystem {
  private comboCount: number = 0;
  
  /**
   * Calculate combo bonus and update combo counter
   * @param linesCleared - Lines cleared this turn
   * @param level - Current level
   * @returns Bonus points from combo
   */
  calculateComboBonus(linesCleared: number, level: number): number {
    if (linesCleared === 0) {
      // Combo broken
      this.comboCount = 0;
      return 0;
    }
    
    // Combo continues - calculate bonus before incrementing
    const bonus = this.comboCount * 50 * (level + 1);
    this.comboCount++;
    
    return bonus;
  }
  
  reset(): void {
    this.comboCount = 0;
  }
  
  getCurrentCombo(): number {
    return this.comboCount;
  }
}

/**
 * Complete scoring system that combines all scoring elements
 */
class ScoreSystem {
  private totalScore: number = 0;
  private totalLines: number = 0;
  private combo: ComboSystem = new ComboSystem();
  
  /**
   * Process a line clear and calculate total points awarded
   * @param linesCleared - Number of lines cleared
   * @param softDropCells - Cells soft-dropped this piece
   * @param hardDropCells - Cells hard-dropped this piece  
   * @param isTSpin - Whether this was a T-Spin move
   * @returns Points awarded for this action
   */
  processLineClear(
    linesCleared: number,
    softDropCells: number = 0,
    hardDropCells: number = 0,
    isTSpin: boolean = false
  ): number {
    const currentLevel = calculateLevel(this.totalLines);
    
    let points = 0;
    
    // Line clear points
    if (isTSpin && linesCleared > 0) {
      points += calculateTSpinScore(linesCleared, currentLevel, 'normal');
    } else {
      points += calculateLineScore(linesCleared, currentLevel);
    }
    
    // Drop points
    points += calculateSoftDropScore(softDropCells);
    points += calculateHardDropScore(hardDropCells);
    
    // Combo bonus
    points += this.combo.calculateComboBonus(linesCleared, currentLevel);
    
    // Update totals
    this.totalScore += points;
    this.totalLines += linesCleared;
    
    return points;
  }
  
  getTotalScore(): number { return this.totalScore; }
  getTotalLines(): number { return this.totalLines; }
  getCurrentLevel(): number { return calculateLevel(this.totalLines); }
}
```

## For 3D Tube Tetris (Additional Math)

### 1. **Cylindrical Coordinates**
```typescript
// Convert between cylindrical and Cartesian
function cylindricalToCartesian(radius: number, angle: number, height: number) {
  return {
    x: radius * Math.cos(angle),
    y: height,
    z: radius * Math.sin(angle)
  };
}

// Segment-based positioning
function getSegmentAngle(segment: number, totalSegments: number): number {
  return (segment / totalSegments) * 2 * Math.PI;
}
```

### 2. **Tube Grid System**
```typescript
// 2D grid wrapped around cylinder
interface TubePosition {
  segment: number; // Angular position (0 to segments-1)
  row: number;     // Height position (0 to rows-1)
}

// Handle wraparound for horizontal movement
function normalizeSegment(segment: number, totalSegments: number): number {
  return ((segment % totalSegments) + totalSegments) % totalSegments;
}
```

### 3. **Ring Completion Detection**
```typescript
function checkCompleteRings(grid: TubeGrid): number[] {
  const completeRings: number[] = [];
  
  for (let row = 0; row < grid.height; row++) {
    let isComplete = true;
    for (let segment = 0; segment < grid.segments; segment++) {
      if (grid.cells[row][segment] === 0) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) completeRings.push(row);
  }
  
  return completeRings;
}
```

## Key Algorithms

### 1. **Wall Kicks** (Advanced)
When rotation fails, try shifting the piece to make it fit:
```typescript
const wallKickOffsets = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]
];
```

### 2. **Ghost Piece** (Preview)
Show where piece will land:
```typescript
function calculateGhostPosition(piece: Piece, grid: Grid): Piece {
  const ghost = piece.clone();
  while (isValidPosition(ghost, grid)) {
    ghost.y++;
  }
  ghost.y--; // Back up one step
  return ghost;
}
```

### 3. **T-Spin Detection** (Advanced)
Special scoring for T-piece rotations in tight spaces.

## Performance Considerations

- **Efficient Grid Updates**: Only check affected rows for line clears
- **Batch Operations**: Update multiple lines at once
- **Spatial Partitioning**: For complex collision detection
- **Frame Rate Independence**: Use delta time for consistent gameplay

## Summary

The math is relatively straightforward - mostly basic arithmetic, array manipulation, and simple trigonometry for the 3D tube variant. The complexity comes from managing state transitions and ensuring smooth, responsive gameplay.

Key mathematical concepts:
- **2D/3D coordinate transformations**
- **Matrix rotations** (90° increments)
- **Collision detection algorithms**
- **Modular arithmetic** (for tube wraparound)
- **Timing functions** (exponential difficulty curves)
- **Scoring algorithms** (multiplicative bonuses)

The challenge lies not in complex mathematics, but in clean state management, efficient algorithms, and creating responsive, satisfying gameplay mechanics.

## References and Further Reading

### Mathematical Concepts
- **2D Rotation Matrices**: [Wikipedia - Rotation Matrix](https://en.wikipedia.org/wiki/Rotation_matrix)
- **Coordinate System Transformations**: [Khan Academy - Transformations](https://www.khanacademy.org/math/geometry/hs-geo-transformations)
- **Collision Detection Algorithms**: [Real-Time Collision Detection by Christer Ericson](https://www.amazon.com/Real-Time-Collision-Detection-Interactive-Technology/dp/1558607323)
- **Modular Arithmetic**: [Wikipedia - Modular Arithmetic](https://en.wikipedia.org/wiki/Modular_arithmetic)
- **Cylindrical Coordinates**: [Wikipedia - Cylindrical Coordinate System](https://en.wikipedia.org/wiki/Cylindrical_coordinate_system)

### Game Development Concepts
- **Game Loop Architecture**: [Game Programming Patterns - Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- **Fixed Timestep vs Variable Timestep**: [Glenn Fiedler - Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)
- **Delta Time**: [Unity Documentation - Time and Framerate Management](https://docs.unity3d.com/Manual/TimeFrameManagement.html)
- **State Machines**: [Game Programming Patterns - State](https://gameprogrammingpatterns.com/state.html)

### Tetris-Specific Resources
- **Tetris Guidelines**: [Tetris Wiki - Tetris Guideline](https://tetris.wiki/Tetris_Guideline)
- **Super Rotation System (SRS)**: [Tetris Wiki - SRS](https://tetris.wiki/Super_Rotation_System)
- **Tetris Scoring System**: [Tetris Wiki - Scoring](https://tetris.wiki/Scoring)
- **7-Bag Randomizer**: [Tetris Wiki - Random Generator](https://tetris.wiki/Random_Generator)
- **Lock Delay Mechanics**: [Tetris Wiki - Lock Delay](https://tetris.wiki/Lock_delay)

### Performance and Optimization
- **Spatial Partitioning**: [Wikipedia - Spatial Database](https://en.wikipedia.org/wiki/Spatial_database)
- **Algorithm Complexity**: [Big O Notation](https://www.bigocheatsheet.com/)
- **Memory Management**: [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)

### 3D Graphics (for Tube Tetris)
- **Three.js Documentation**: [Three.js Official Docs](https://threejs.org/docs/)
- **3D Transformations**: [Scratchapixel - 3D Transformations](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/transforming-points-and-vectors)
- **Cylindrical Mapping**: [OpenGL Tutorial - Texture Mapping](https://learnopengl.com/Getting-started/Textures)
- **WebGL Fundamentals**: [WebGL Fundamentals](https://webglfundamentals.org/)

### Input Handling
- **Delayed Auto Shift (DAS)**: [Tetris Wiki - DAS](https://tetris.wiki/DAS)
- **Auto Repeat Rate (ARR)**: [Tetris Wiki - ARR](https://tetris.wiki/ARR)
- **Input Lag Optimization**: [Input Lag in Games](https://displaylag.com/what-is-input-lag-the-breakdown/)

### Academic Papers
- **Tetris AI and Complexity**: [Tetris is Hard, Even to Approximate](https://erikdemaine.org/papers/Tetris_COCOON2003/)
- **Game Balance Theory**: [Game Balance Concepts](https://www.gamasutra.com/view/feature/134768/game_balance_concepts_a_.php)
- **Procedural Content Generation**: [PCG Wiki](http://pcg.wikidot.com/)

### Tools and Libraries
- **TypeScript Documentation**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **Vite Build Tool**: [Vite Guide](https://vitejs.dev/guide/)
- **Vitest Testing**: [Vitest Documentation](https://vitest.dev/)
- **Jest Testing Patterns**: [Jest Testing Framework](https://jestjs.io/docs/getting-started)