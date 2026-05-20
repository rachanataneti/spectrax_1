import type { Pose as PoseType, Results } from '@mediapipe/pose';

// MediaPipe's npm packages are not ESM-compatible. Since we load them via CDN in index.html,
// we use the global variables to avoid Vite module resolution errors.
const Pose = (window as any).Pose as typeof PoseType;



/**
 * poseService
 *
 * Wrapper around Mediapipe pose for real-time body tracking.
 * Handles initinalization , frame processing , error recovery, and cleanup.
 * Uses CDN-loaded Mediapipe model to avoid vite building issue. 
 */

export class PoseService {
  private pose: PoseType | null = null;
  private isLoaded: boolean = false;
  private inProgress: boolean = false;
  private errorCount: number = 0;
  /**
   *Initializes poseService and automatically sets up Mefia pipe pise instance.
   *Calls init() internally to configure model and options.
   */
  
  constructor() {
    this.init();
  }
  /**
  * Initializes MediaPipe Pose instance using CDN-hosted assets.
  * Configures Model settings like detection confidence and smoothing.
  * Ensure safe setup with error handling for browser-based execuation.
  */

  private init() {
    if (this.pose) return;

    try {
      this.pose = new Pose({
        locateFile: (file) => {
          // Standard CDN - JSDelivr is usually the most reliable for MediaPipe
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isLoaded = true;
      console.log("PoseService: initialized.");
    } catch (error) {
      console.error("PoseService: Failed to initialize MediaPipe Pose", error);
    }
  }

  /**
   * Registera callback to receive pose detection results.
   * 
   * @param callback - function triggered whenever Mediapipe returns pose landmarks.
   */
  onResults(callback: (results: Results) => void) {
    if (!this.pose) return;
    
    this.pose.onResults((results: any) => {
      this.inProgress = false;
      this.errorCount = 0; // Reset error count on success
      if (results) {
        callback(results);
      }
    });
  }

  /**
   * Send a video/image frame to Mediapipe for pose detection.
   *
   * Prevents overlapping processing using inProograss flag.
   * includes error recovery logic for repeated failures.
   *
   * @param image - video , canvas,or image frame to analyze. 
   */
  async send(image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) {
    if (!this.pose || !this.isLoaded || this.inProgress) return;
    
    this.inProgress = true;
    try {
      await this.pose.send({ image });
    } catch (error) {
      this.inProgress = false;
      this.errorCount++;
      console.error("PoseService: send error", error);
      
      // If we see recurring fatal errors, try to re-initialize
      if (this.errorCount > 10) {
          console.warn("PoseService: too many errors, attempting reset...");
          this.close();
          this.init();
          this.errorCount = 0;
      }
    }
  }

  /**
   * safely closes MediaPipe pose instance and frees resources.
   * reset internal state to allow re-initialization if needed.
   */
  async close() {
    if (this.pose) {
      try {
        await this.pose.close();
      } catch (e) {
        console.warn("Error closing pose:", e);
      }
      this.pose = null;
      this.isLoaded = false;
    }
  }
}

// Ensure singleton instance
const globalPoseService = new PoseService();
export { globalPoseService as poseService };
