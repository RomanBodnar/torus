import { Vector3 } from 'three';
import { ITubeGeometry } from '../types';

/**
 * TubeGeometry class represents the cylindrical tube structure for the 3D Tetris game.
 * Provides basic properties and coordinate system for the game tube.
 */
export class TubeGeometry implements ITubeGeometry {
    public readonly radius: number;
    public readonly height: number;
    public readonly segments: number;

    /**
     * Creates a new TubeGeometry instance.
     * @param radius - The radius of the tube (default: 5)
     * @param height - The height of the tube (default: 20)
     * @param segments - The number of segments around the circumference (default: 8)
     */
    constructor(radius: number = 5, height: number = 20, segments: number = 8) {
        this.radius = radius;
        this.height = height;
        this.segments = segments;
    }

    /**
     * Gets the angle in radians for a given segment.
     * @param segment - The segment index (0 to segments-1)
     * @returns The angle in radians
     */
    getSegmentAngle(segment: number): number {
        return (segment / this.segments) * Math.PI * 2;
    }

    /**
     * Converts tube coordinates to world position.
     * @param segment - The segment index around the circumference
     * @param row - The row index from bottom to top
     * @returns The world position as Vector3
     */
    getWorldPosition(segment: number, row: number): Vector3 {
        return this.tubeToWorld(segment, row);
    }

    /**
     * Converts tube coordinates to world coordinates.
     * @param segment - The segment index around the circumference
     * @param row - The row index from bottom to top
     * @returns The world position as Vector3
     */
    tubeToWorld(segment: number, row: number): Vector3 {
        const angle = this.getSegmentAngle(segment);
        const x = Math.cos(angle) * this.radius;
        const z = Math.sin(angle) * this.radius;
        const y = row - (this.height / 2); // Center the tube vertically

        return new Vector3(x, y, z);
    }

    /**
     * Converts world coordinates to tube coordinates.
     * @param position - The world position as Vector3
     * @returns Object with segment and row indices
     */
    worldToTube(position: Vector3): { segment: number; row: number } {
        // Calculate angle from x,z coordinates
        const angle = Math.atan2(position.z, position.x);
        // Normalize angle to 0-2π range
        const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
        // Convert to segment index
        const segment = Math.round((normalizedAngle / (Math.PI * 2)) * this.segments) % this.segments;

        // Calculate row from y coordinate
        const row = Math.round(position.y + (this.height / 2));

        return { segment, row };
    }
}