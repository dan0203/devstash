"use client";

import { useEffect, useRef } from "react";
import { AppWindow, Terminal, FileText, Bookmark } from "lucide-react";
import { NotionIcon, GitHubIcon, SlackIcon, VSCodeIcon } from "@/components/homepage/BrandIcons";

const ICON_SIZE = 56;
const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 0.22;
const MAX_SPEED = 0.5;

const CHAOS_ICONS = [
  { key: "notion", label: "Notion", Icon: NotionIcon },
  { key: "github", label: "GitHub", Icon: GitHubIcon },
  { key: "slack", label: "Slack", Icon: SlackIcon },
  { key: "vscode", label: "VS Code", Icon: VSCodeIcon },
  { key: "tabs", label: "Browser tabs", Icon: AppWindow },
  { key: "terminal", label: "Terminal", Icon: Terminal },
  { key: "file", label: "Text file", Icon: FileText },
  { key: "bookmark", label: "Bookmark", Icon: Bookmark },
];

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  pulsePhase: number;
  pulseSpeed: number;
}

export function ChaosField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const fieldRect = field.getBoundingClientRect();
    const initW = Math.max(fieldRect.width, 260);
    const initH = Math.max(fieldRect.height, 260);

    const state: IconState[] = CHAOS_ICONS.map(() => ({
      x: Math.random() * (initW - ICON_SIZE),
      y: Math.random() * (initH - ICON_SIZE),
      vx: (Math.random() - 0.5) * MAX_SPEED,
      vy: (Math.random() - 0.5) * MAX_SPEED,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.01,
    }));

    function handleMouseMove(e: MouseEvent) {
      const rect = field!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }
    field.addEventListener("mousemove", handleMouseMove);
    field.addEventListener("mouseleave", handleMouseLeave);

    let frameId: number;
    function step() {
      const rect = field!.getBoundingClientRect();
      const w = rect.width || 260;
      const h = rect.height || 260;
      const { x: mouseX, y: mouseY } = mouseRef.current;

      state.forEach((s, i) => {
        const dx = s.x + ICON_SIZE / 2 - mouseX;
        const dy = s.y + ICON_SIZE / 2 - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }

        s.x += s.vx;
        s.y += s.vy;

        const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (speed > MAX_SPEED * 1.6) {
          s.vx = (s.vx / speed) * MAX_SPEED * 1.6;
          s.vy = (s.vy / speed) * MAX_SPEED * 1.6;
        }

        if (s.x <= 0) {
          s.x = 0;
          s.vx = Math.abs(s.vx);
        } else if (s.x >= w - ICON_SIZE) {
          s.x = w - ICON_SIZE;
          s.vx = -Math.abs(s.vx);
        }
        if (s.y <= 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy);
        } else if (s.y >= h - ICON_SIZE) {
          s.y = h - ICON_SIZE;
          s.vy = -Math.abs(s.vy);
        }

        s.vx += (Math.random() - 0.5) * 0.01;
        s.vy += (Math.random() - 0.5) * 0.01;

        s.rotation += s.rotSpeed;
        s.pulsePhase += s.pulseSpeed;
        const scale = 1 + Math.sin(s.pulsePhase) * 0.08;

        const el = iconRefs.current[i];
        if (el) {
          el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) scale(${scale})`;
        }
      });

      frameId = requestAnimationFrame(step);
    }
    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      field.removeEventListener("mousemove", handleMouseMove);
      field.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className="relative m-3 flex-1 overflow-hidden rounded-lg"
      style={{
        backgroundImage:
          "radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.06), transparent 60%)",
      }}
    >
      {CHAOS_ICONS.map(({ key, label, Icon }, i) => (
        <div
          key={key}
          ref={(el) => {
            iconRefs.current[i] = el;
          }}
          aria-label={label}
          className="absolute flex size-14 items-center justify-center text-muted-foreground will-change-transform select-none [&_svg]:size-[50px]"
        >
          <Icon />
        </div>
      ))}
    </div>
  );
}
