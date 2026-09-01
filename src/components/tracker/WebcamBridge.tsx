import { useEffect, useRef } from "react";
import { useTracker } from "@/lib/tracker/store";
import { webcamVideo } from "@/lib/tracker/webcam";

type FaceBox = { x: number; y: number; width: number; height: number };

interface FaceDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: FaceBox }>>;
}

export function WebcamBridge() {
  const mode = useTracker((s) => s.mode);
  const setWebcam = useTracker((s) => s.setWebcam);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (mode !== "webcam") {
      stop();
      webcamVideo.current = null;
      setWebcam(null, null, false);
      return;
    }

    let cancelled = false;
    let detector: FaceDetectorLike | null = null;
    const FD = (window as unknown as { FaceDetector?: new () => FaceDetectorLike })
      .FaceDetector;
    if (FD) {
      try {
        detector = new FD();
      } catch {
        detector = null;
      }
    }

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        webcamVideo.current = video;
        await video.play();
        loop();
      } catch {
        setWebcam(null, null, false);
      }
    }

    function loop() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (detector) {
        detector
          .detect(video)
          .then((faces) => {
            if (!faces.length) {
              setWebcam(null, null, false);
              return;
            }
            const b = faces[0].boundingBox;
            const cx = b.x + b.width / 2;
            const cy = b.y + b.height / 2;
            const nx = (cx / video.videoWidth) * 2 - 1;
            const ny = (cy / video.videoHeight) * 2 - 1;
            setWebcam(nx, ny, true);
          })
          .catch(() => {
            /* keep last */
          });
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    start();

    function stop() {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      webcamVideo.current = null;
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [mode, setWebcam]);

  if (mode !== "webcam") return null;

  return (
    <video
      ref={videoRef}
      className="pointer-events-none fixed h-px w-px opacity-0"
      playsInline
      muted
      aria-hidden="true"
    />
  );
}
