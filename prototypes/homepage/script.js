// ===== Footer year =====
document.getElementById("copyrightYear").textContent =
  `© ${new Date().getFullYear()} DevStash. All rights reserved.`;

// ===== Navbar opacity on scroll =====
const navbar = document.getElementById("navbar");
function updateNavbar() {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
}
window.addEventListener("scroll", updateNavbar, { passive: true });
updateNavbar();

// ===== Scroll fade-in =====
const fadeEls = document.querySelectorAll(".fade-in");
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
fadeEls.forEach((el) => fadeObserver.observe(el));

// ===== Pricing toggle (monthly / yearly) =====
const billingToggle = document.getElementById("billingToggle");
const proPrice = document.getElementById("proPrice");
const proPeriod = document.getElementById("proPeriod");
const proPriceNote = document.getElementById("proPriceNote");

billingToggle.addEventListener("click", () => {
  const isYearly = billingToggle.getAttribute("aria-pressed") !== "true";
  billingToggle.setAttribute("aria-pressed", String(isYearly));
  proPriceNote.hidden = !isYearly;
  if (isYearly) {
    proPrice.textContent = "$72";
    proPeriod.textContent = "/yr";
  } else {
    proPrice.textContent = "$8";
    proPeriod.textContent = "/mo";
  }
});

// ===== Chaos icon animation =====
// Icons drift with their own velocity, bounce off the container walls,
// gently rotate/pulse, and steer away from the mouse cursor.
const chaosField = document.getElementById("chaosField");

if (chaosField) {
  const icons = Array.from(chaosField.querySelectorAll(".chaos-icon"));
  const ICON_SIZE = 56;
  const REPEL_RADIUS = 90;
  const REPEL_STRENGTH = 0.22;
  const MAX_SPEED = 0.5;

  let mouseX = -1000;
  let mouseY = -1000;

  chaosField.addEventListener("mousemove", (e) => {
    const rect = chaosField.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  chaosField.addEventListener("mouseleave", () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  const state = icons.map((el, i) => {
    const fieldRect = chaosField.getBoundingClientRect();
    const w = Math.max(fieldRect.width, 260);
    const h = Math.max(fieldRect.height, 260);
    return {
      el,
      x: Math.random() * (w - ICON_SIZE),
      y: Math.random() * (h - ICON_SIZE),
      vx: (Math.random() - 0.5) * MAX_SPEED,
      vy: (Math.random() - 0.5) * MAX_SPEED,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.01,
    };
  });

  function step() {
    const fieldRect = chaosField.getBoundingClientRect();
    const w = fieldRect.width || 260;
    const h = fieldRect.height || 260;

    state.forEach((s) => {
      // Repel from mouse
      const dx = s.x + ICON_SIZE / 2 - mouseX;
      const dy = s.y + ICON_SIZE / 2 - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0.001) {
        const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
      }

      // Integrate position
      s.x += s.vx;
      s.y += s.vy;

      // Clamp speed
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > MAX_SPEED * 1.6) {
        s.vx = (s.vx / speed) * MAX_SPEED * 1.6;
        s.vy = (s.vy / speed) * MAX_SPEED * 1.6;
      }

      // Bounce off walls
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

      // Gentle drift decay back toward base speed so icons don't stall or run away
      s.vx += (Math.random() - 0.5) * 0.01;
      s.vy += (Math.random() - 0.5) * 0.01;

      s.rotation += s.rotSpeed;
      s.pulsePhase += s.pulseSpeed;
      const scale = 1 + Math.sin(s.pulsePhase) * 0.08;

      s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) scale(${scale})`;
    });

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
