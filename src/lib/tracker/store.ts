import { create } from "zustand";
import {
  createEngineState,
  stepEngine,
  toSnapshot,
  type EngineInput,
} from "./engine";
import { DEFAULT_CONFIG, type SimSnapshot, type TargetMode, type TrackerConfig } from "./types";

type InjectCmd = NonNullable<EngineInput["inject"]>;

interface TrackerStore {
  config: TrackerConfig;
  snapshot: SimSnapshot;
  running: boolean;
  trackingEnabled: boolean;
  estop: boolean;
  mode: TargetMode;
  dragAz: number;
  dragEl: number;
  webcamNx: number | null;
  webcamNy: number | null;
  webcamPresent: boolean;
  inject: InjectCmd | null;
  debug: boolean;
  tick: (dt: number) => void;
  setConfig: (patch: Partial<TrackerConfig> | ((c: TrackerConfig) => TrackerConfig)) => void;
  setRunning: (v: boolean) => void;
  setTracking: (v: boolean) => void;
  setEstop: (v: boolean) => void;
  setMode: (m: TargetMode) => void;
  setDrag: (az: number, el: number) => void;
  setWebcam: (nx: number | null, ny: number | null, present: boolean) => void;
  fire: (cmd: InjectCmd) => void;
  reset: () => void;
  setDebug: (v: boolean) => void;
}

const engineRef = { current: createEngineState() };

function inputFrom(s: TrackerStore): EngineInput {
  return {
    running: s.running,
    trackingEnabled: s.trackingEnabled && !s.estop,
    estop: s.estop,
    mode: s.mode,
    dragAz: s.dragAz,
    dragEl: s.dragEl,
    webcamNx: s.webcamNx,
    webcamNy: s.webcamNy,
    webcamPresent: s.webcamPresent,
    inject: s.inject,
  };
}

function snap(s: Omit<TrackerStore, "snapshot"> & { snapshot?: SimSnapshot }): SimSnapshot {
  return toSnapshot(engineRef.current, s.config, {
    running: s.running,
    trackingEnabled: s.trackingEnabled,
    estop: s.estop,
    mode: s.mode,
    dragAz: s.dragAz,
    dragEl: s.dragEl,
    webcamNx: s.webcamNx,
    webcamNy: s.webcamNy,
    webcamPresent: s.webcamPresent,
    inject: s.inject,
  });
}

export const useTracker = create<TrackerStore>((set, get) => ({
  config: DEFAULT_CONFIG,
  snapshot: snap({
    config: DEFAULT_CONFIG,
    running: true,
    trackingEnabled: true,
    estop: false,
    mode: "patrol",
    dragAz: 12,
    dragEl: 4,
    webcamNx: null,
    webcamNy: null,
    webcamPresent: false,
    inject: null,
    debug: false,
    tick: () => undefined,
    setConfig: () => undefined,
    setRunning: () => undefined,
    setTracking: () => undefined,
    setEstop: () => undefined,
    setMode: () => undefined,
    setDrag: () => undefined,
    setWebcam: () => undefined,
    fire: () => undefined,
    reset: () => undefined,
    setDebug: () => undefined,
  }),
  running: true,
  trackingEnabled: true,
  estop: false,
  mode: "patrol",
  dragAz: 12,
  dragEl: 4,
  webcamNx: null,
  webcamNy: null,
  webcamPresent: false,
  inject: null,
  debug: true,
  tick: (dt) => {
    const s = get();
    const input = inputFrom(s);
    engineRef.current = stepEngine(engineRef.current, dt, s.config, input);
    set({
      snapshot: toSnapshot(engineRef.current, s.config, input),
      inject: null,
    });
  },
  setConfig: (patch) => {
    set((s) => {
      const config = typeof patch === "function" ? patch(s.config) : { ...s.config, ...patch };
      return { config };
    });
  },
  setRunning: (v) => set({ running: v }),
  setTracking: (v) => set({ trackingEnabled: v }),
  setEstop: (v) => {
    if (v) {
      set({ estop: true, trackingEnabled: false });
    } else {
      set({ estop: false });
    }
  },
  setMode: (m) => set({ mode: m }),
  setDrag: (az, el) => set({ dragAz: az, dragEl: el, mode: "drag" }),
  setWebcam: (nx, ny, present) =>
    set({ webcamNx: nx, webcamNy: ny, webcamPresent: present }),
  fire: (cmd) => set({ inject: cmd, trackingEnabled: true, estop: false }),
  reset: () => {
    engineRef.current = createEngineState();
    set((s) => ({
      estop: false,
      trackingEnabled: true,
      running: true,
      snapshot: toSnapshot(engineRef.current, s.config, {
        running: true,
        trackingEnabled: true,
        estop: false,
        mode: s.mode,
        dragAz: s.dragAz,
        dragEl: s.dragEl,
        webcamNx: null,
        webcamNy: null,
        webcamPresent: false,
        inject: null,
      }),
    }));
  },
  setDebug: (v) => set({ debug: v }),
}));
