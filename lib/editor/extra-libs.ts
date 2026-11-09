/**
 * TypeScript model stubs handed to the editor's language service.
 *
 * These describe EXACTLY what the sandbox runtime makes available to user
 * code (see runtime/src/index.tsx). Kept small and hand-written; they are the
 * contract between the editor's intellisense and the sandbox.
 */

export const REACT_STUB = String.raw`declare module "react" {
  export type ReactNode = any;
  export type ReactElement = any;
  export const Fragment: any;
  export function createElement(type: any, props?: any, ...children: any[]): ReactElement;
  export function cloneElement(element: ReactElement, props?: any, ...children: any[]): ReactElement;
  export function isValidElement(object: any): boolean;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useState<S>(initial: S): [S, (next: S | ((prev: S) => S)) => void];
  export function useReducer<S, A>(reducer: (state: S, action: A) => S, initial: S): [S, (action: A) => void];
  export function createContext<T>(initial: T): any;
  export function useContext(context: any): T;
}
`;

export const FRAMER_MOTION_STUB = String.raw`declare module "framer-motion" {
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    style?: any;
    whileHover?: any;
    whileTap?: any;
    whileInView?: any;
    custom?: any;
    [key: string]: any;
  }
  type MotionComponent = (props: MotionProps & {
    children?: any;
    className?: string;
    ref?: any;
  }) => any;
  export const motion: {
    div: MotionComponent;
    span: MotionComponent;
    h1: MotionComponent; h2: MotionComponent; h3: MotionComponent;
    h4: MotionComponent; h5: MotionComponent; h6: MotionComponent;
    p: MotionComponent; a: MotionComponent; button: MotionComponent;
    ul: MotionComponent; ol: MotionComponent; li: MotionComponent;
    svg: MotionComponent; path: MotionComponent; circle: MotionComponent;
    rect: MotionComponent; g: MotionComponent; img: MotionComponent;
    video: MotionComponent; main: MotionComponent; section: MotionComponent;
    header: MotionComponent; footer: MotionComponent; nav: MotionComponent;
    article: MotionComponent; aside: MotionComponent; form: MotionComponent;
    input: MotionComponent; label: MotionComponent; canvas: MotionComponent;
    [key: string]: MotionComponent;
  };
  export const AnimatePresence: (props: { children?: any; mode?: any; initial?: boolean }) => any;
  export function useAnimationFrame(callback: (time: number, delta: number) => void): void;
  export const useSpringValue: any;
}
`;

export const LUCIDE_STUB = String.raw`declare module "lucide-react" {
  export type LucideIcon = (props: { size?: number | string; className?: string; [key: string]: any }) => any;
  const icons: Record<string, LucideIcon>;
  export = icons;
}
`;

export const RUNTIME_STUB = String.raw`declare module "@reosion/runtime" {
  /**
   * The deterministic animation clock, in seconds. The runtime re-renders
   * your component whenever the clock moves (playback, scrubbing, export
   * frames). All time-based visuals should derive from this value.
   */
  export function useTime(): number;

  /** Stage metadata of the current project. */
  export function useStage(): { width: number; height: number; fps: number; duration: number };

  export function clamp(value: number, min: number, max: number): number;
  export function lerp(a: number, b: number, t: number): number;
}
`;

export const JSX_RUNTIME_STUB = String.raw`declare module "react/jsx-runtime" {
  export function jsx(type: any, props: any, key?: string | number): any;
  export function jsxs(type: any, props: any, key?: string | number): any;
  export const Fragment: any;
}

declare global {
  namespace JSX {
    type Element = any;
    type ElementClass = any;
    type ElementAttributesProperty = any;
    interface IntrinsicElements {
      [element: string]: { [attribute: string]: any };
    }
    interface IntrinsicAttributes {
      [attribute: string]: any;
    }
  }
}
`;

export interface ExtraLib {
  path: string;
  content: string;
}

export const EXTRA_LIBS: ExtraLib[] = [
  { path: "react/index.d.ts", content: REACT_STUB },
  { path: "react/jsx-runtime.d.ts", content: JSX_RUNTIME_STUB },
  { path: "framer-motion/index.d.ts", content: FRAMER_MOTION_STUB },
  { path: "lucide-react/index.d.ts", content: LUCIDE_STUB },
  { path: "@reosion/runtime/index.d.ts", content: RUNTIME_STUB },
];
