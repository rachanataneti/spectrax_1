import type { Results } from '@mediapipe/pose';

// MediaPipe's npm packages are not ESM-compatible. We use globals from the CDN scripts.
const POSE_CONNECTIONS = (window as any).POSE_CONNECTIONS;
const drawConnectors = (window as any).drawConnectors;
const drawLandmarks = (window as any).drawLandmarks;


/**
 * overlayRenderer 
 * Responsible for drawing real-time MediaPipe pose skeleton on canvas.
 * Provides visual feedback for fitness tracking with dynamic hightlighting.
 * Status-based coloring, and scanning animation effects.
 */

export class OverlayRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private scanY: number = 0;
  private scanDirection: number = 1;

  /** 
  * Sets the canvas rendering context used for drawing pose overlay.
  * 
  * @param ctx - 2D rendering context from HTML canves.
  */
  
  setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  /**
  * Clear the entire canvas before rendering a new frame.
  */

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * Returns neno color based on exercises performance status.
   *
   * @param status - current movement quality (green/yellow/red).
   * @return HEX color string for rendering.
   */
  private getStatusColor(status: 'green' | 'yellow' | 'red') {
    switch (status) {
      case 'green': return '#00ff88';
      case 'yellow': return '#ffd600';
      case 'red': return '#ff3b5c';
      default: return '#00f0ff';
    }
  }

  /**
    * Render pose skeleton overlay on canvas using MediaPipe results
    * 
    * Highlights :
    * - Full body skeleton connections
    * - Primary exercise joints
    * - Performance - based color coding
    * - Scanning animation effects 
    *
    * @param results - MediaPipe Pose detection results 
    * @param status - Exercise quality indicatoer(green/yellow/red)
    * @param primaryJoints - key joints relevant to current exercise 
   */
  draw(results: Results, status: 'green' | 'yellow' | 'red' = 'green', primaryJoints: number[] = []) {
    if (!this.ctx || !results.poseLandmarks) return;

    this.clear();
    const color = this.getStatusColor(status);
    const glow = `${color}88`;

    this.drawScanningLine();

    // 1. Draw standard connectors with status color
    drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: 'rgba(255, 255, 255, 0.2)',
      lineWidth: 2,
    });

    // 2. Draw highlighted connections for primary workout joints
    // This provides stronger visual feedback on the active movement.
    drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: color,
      lineWidth: 4,
    });

    // 3. Draw Landmarks with dynamic size/glow
    drawLandmarks(this.ctx, results.poseLandmarks, {
      color: '#ffffff',
      fillColor: (data: any) => {
          // Highlight primary joints with stronger color
          return primaryJoints.includes(data.index!) ? color : 'rgba(255,255,255,0.5)';
      },
      lineWidth: 1,
      radius: (data: any) => {
        return primaryJoints.includes(data.index!) ? 6 : 2;
      }
    });

    // Global glow
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = glow;
  }
  /**
  * Draws animated scanning line across canvas for visual feedback.
  * creats motion effects to indicate live tracking.
  */

  private drawScanningLine() {
    if (!this.ctx) return;
    const canvas = this.ctx.canvas;
    
    this.scanY += 3 * this.scanDirection;
    if (this.scanY > canvas.height || this.scanY < 0) {
      this.scanDirection *= -1;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.scanY);
    this.ctx.lineTo(canvas.width, this.scanY);
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }
}

export const overlayRenderer = new OverlayRenderer();
