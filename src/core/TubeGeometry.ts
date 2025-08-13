export class TubeGeometry {
    readonly Radius: number;
    readonly Height: number;
    readonly Segments: number;

    constructor(radius: number = 5, height: number = 20, segments: number = 15)
    {
        this.Radius = radius;
        this.Height = height;
        this.Segments = segments;
    }
}