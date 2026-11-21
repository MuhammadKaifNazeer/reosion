import type { Project } from "@/lib/types";
import { code as cachingCode } from "@/examples/caching";
import { code as helloCode } from "@/examples/hello-motion";
import { code as ballCode } from "@/examples/bouncing-ball";
import { code as cardsCode } from "@/examples/fade-in-cards";
import { code as progressCode } from "@/examples/progress-bar";
import { code as waveCode } from "@/examples/wave";

export interface Example {
  slug: string;
  title: string;
  description: string;
  path: string;
  code: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
}

export const EXAMPLES: Example[] = [
  {
    slug: "caching",
    title: "Caching",
    description: "Why the second request is faster than the first.",
    path: "examples/caching",
    code: cachingCode,
    duration: 32.5,
    fps: 30,
    width: 1280,
    height: 720,
  },
  {
    slug: "hello-motion",
    title: "Hello Motion",
    description: "A title that fades, rises and breathes.",
    path: "examples/hello-motion",
    code: helloCode,
    duration: 6,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "bouncing-ball",
    title: "Bouncing Ball",
    description: "A ball that bounces with a squash on landing.",
    path: "examples/bouncing-ball",
    code: ballCode,
    duration: 4,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "fade-in-cards",
    title: "Fade-in Cards",
    description: "Three cards that slide up and fade in.",
    path: "examples/fade-in-cards",
    code: cardsCode,
    duration: 4,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "progress-bar",
    title: "Progress Bar",
    description: "A progress bar that fills and drains.",
    path: "examples/progress-bar",
    code: progressCode,
    duration: 6,
    fps: 30,
    width: 1920,
    height: 1080,
  },
  {
    slug: "wave",
    title: "Wave",
    description: "A row of bars dancing in a wave.",
    path: "examples/wave",
    code: waveCode,
    duration: 6,
    fps: 30,
    width: 1920,
    height: 1080,
  },
];

export function findExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}

export function exampleToProject(example: Example): Project {
  return {
    id: "example-" + example.slug,
    name: example.title,
    aspectRatio: "16:9",
    width: example.width,
    height: example.height,
    fps: example.fps,
    duration: example.duration,
    code: example.code,
    createdAt: 0,
    updatedAt: 0,
  };
}