import { Vector2, Vector3, Color, Scene, PerspectiveCamera, WebGLRenderer } from 'three';

// Enums
export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L'
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  MENU = 'MENU'
}

// Core Interfaces
export interface TetrominoShape {
  blocks: Vector2[];
  color: Color;
  type: TetrominoType;
}

export interface GameState {
  score: number;
  level: number;
  linesCleared: number;
  currentPiece: Tetromino | null;
  nextPiece: TetrominoType;
  tubeRotation: number;
  fallSpeed: number;
  status: GameStatus;
  fallTimer: number;
}

export interface InputController {
  onRotateLeft(): void;
  onRotateRight(): void;
  onSoftDrop(): void;
  onHardDrop(): void;
  onRotatePiece(): void;
  onPause(): void;
  onRestart(): void;
}

// Class interfaces for implementation
export interface ITubeGeometry {
  radius: number;
  height: number;
  segments: number;
  
  getSegmentAngle(segment: number): number;
  getWorldPosition(segment: number, row: number): Vector3;
  tubeToWorld(segment: number, row: number): Vector3;
  worldToTube(position: Vector3): { segment: number; row: number };
}

export interface ITetromino {
  shape: TetrominoShape;
  position: Vector3;
  rotation: number;
  tubeRotation: number;
  
  rotate(): void;
  getBlockPositions(): Vector3[];
  clone(): ITetromino;
}

export interface ITubeGrid {
  segments: number;
  rows: number;
  grid: (ITetromino | null)[][];
  
  isOccupied(segment: number, row: number): boolean;
  placePiece(tetromino: ITetromino, tubeRotation: number): void;
  canPlacePiece(tetromino: ITetromino, tubeRotation: number): boolean;
  checkCompleteRings(): number[];
  clearRings(rings: number[]): void;
  clear(): void;
}

export interface IGameEngine {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  tubeGrid: ITubeGrid;
  gameState: GameState;
  
  init(): void;
  update(deltaTime: number): void;
  render(): void;
  rotateTube(direction: number): void;
  dropPiece(): void;
  resetGame(): void;
}

// Forward declaration for circular dependency
export interface Tetromino extends ITetromino {}