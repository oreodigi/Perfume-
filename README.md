# ÉCORCE — Maison de Parfum (Phase 1)

An original, responsive perfume showcase implementation for `oreodigi/Perfume-`, built from the public *design documentation* of [alagappan567/perfume-ecorce-showcase](https://github.com/alagappan567/perfume-ecorce-showcase). The reference repo contains screenshots, DESIGN.md, PROMPTS.md, and PSEUDOCODE.md **but no source code**; this project is independently implemented, not a clone.

## Included in phase 1

- Next.js App Router + React 19 + TypeScript.
- Ten configurable fragrance profiles in `src/data/fragrances.ts`.
- Responsive diagonal, drag-enabled fragrance carousel with momentum and keyboard navigation.
- A **single persistent React Three Fiber WebGL canvas** with procedural glass bottles following DOM anchors, avoiding separate canvas instances per section.
- Interactive press-and-hold introduction with an accessible skip action.
- Animated fragrance storytelling: product still-life, narrative, other extraits, word tunnel, composition orbit, editorial gallery, contact CTA and footer.
- GSAP ScrollTrigger, Lenis smooth scroll, motion-reduction CSS support, WebGL CSS fallbacks.
- Back/forward navigation and shareable perfume URLs: `/?scent=rouge-ecorce`.
- Clearly labelled **demo bag only**; no checkout, payment, real stock or ordering.

## Run locally

Requires Node.js >=20.9 and npm.

```bash
npm install
npm run dev
# open http://localhost:3000
npm run typecheck
npm run build
```

## Production readiness / next phases

1. **3D art:** replace procedural placeholder bottles with branded GLTF assets and calibrated studio HDRI/PBR lighting. Optimize refraction and mobile pixel budgets.
2. **Creative:** provide licensed product still-life/campaign images, logo, final brand copy, and fragrance catalog. CSS-based editorial layouts and remote Unsplash imagery are temporary placeholders.
3. **Motion:** complete matching seamless bottle hand-offs, single-clock synchronized animation, shader-based scent mist, and momentum for collection photo arcs. Test animation and touch interactions on real phones.
4. **Commerce:** connect inventory, catalog, checkout, real email/domain, legal policies, delivery, and analytics only after store requirements are approved. Current `bonjour@ecorce.example` is **not a functioning inbox**.
5. **Quality gate:** install dependencies, run `npm run typecheck` and `npm run build`, verify reduced-motion, WebGL-off/fallback, touch drag, popstate, mobile performance and accessibility. GitHub CI is configured to run after a lockfile is generated.

## Deployment

A typical Node-hosted deployment uses `npm install && npm run build && npm start`. No server or domain has been connected by this commit. The external Google Fonts and Unsplash images require network access; replace them with locally hosted/licensed assets for production.

## Reference acknowledgement

Design direction inspired by the public ÉCORCE showcase documentation; original code and UI written for this repository. The showcase's original application source is private. This project does not claim affiliation with a commercial ÉCORCE brand.
