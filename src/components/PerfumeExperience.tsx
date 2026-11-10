"use client";

import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { fragrances, type Fragrance } from "@/data/fragrances";

const BottleScene = dynamic(() => import("./BottleScene"), { ssr: false });
const EMAIL = "bonjour@ecorce.example";
const PHOTO = {
  rouge: "/perfumes/editorial/rouge.jpg",
  floral: "/perfumes/editorial/floral.jpg",
  atelier: "/perfumes/editorial/atelier.jpg",
  night: "/perfumes/editorial/night.jpg",
  ritual: "/perfumes/editorial/ritual.jpg",
};
const familyOptions = ["All", "Floral", "Woody", "Amber", "Fresh"] as const;
type Family = typeof familyOptions[number];
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

type View = "home" | "detail";

type Drag = {
  pointerId: number;
  x: number;
  offset: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
};

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return <span aria-hidden="true" className={`arrow-glyph ${direction === "left" ? "left" : ""}`}>⟶</span>;
}

function BottleAnchor({ scent, variant = "standard" }: { scent: Fragrance; variant?: string }) {
  return (
    <div className={`bottle-anchor bottle-anchor--${variant}`} data-bottle-anchor={scent.slug} aria-hidden="true">
      <div className="bottle-fallback" style={{ "--liquid": scent.color } as CSSProperties}>
        <span className="fallback-cap" />
        <span className="fallback-glass"><span className="fallback-liquid" /><span className="fallback-label"><small>MAISON</small><b>ÉCORCE</b><i>EXTRAIT DE PARFUM</i></span></span>
      </div>
    </div>
  );
}

export default function PerfumeExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const holdFrame = useRef<number | null>(null);
  const holdStart = useRef(0);
  const dragRef = useRef<Drag | null>(null);
  const [view, setView] = useState<View>("home");
  const [current, setCurrent] = useState(0);
  const [offset, setOffset] = useState(0);
  const [intro, setIntro] = useState(true);
  const [hold, setHold] = useState(0);
  const [toast, setToast] = useState("");
  const [hovering, setHovering] = useState(false);
  const [width, setWidth] = useState(1280);
  const [demoBag, setDemoBag] = useState(0);
  const [family, setFamily] = useState<Family>("All");
  const [quizMood, setQuizMood] = useState("Mysterious");
  const [quizMoment, setQuizMoment] = useState("After dark");
  const scent = fragrances[current];
  const activeIndex = clamp(Math.round(offset), 0, fragrances.length - 1);
  const featured = fragrances[activeIndex];

  const finishIntro = useCallback(() => {
    if (holdFrame.current !== null) cancelAnimationFrame(holdFrame.current);
    holdFrame.current = null;
    setHold(100);
    setIntro(false);
    try { sessionStorage.setItem("ecorce-intro-seen", "true"); } catch { /* disabled storage */ }
  }, []);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update, { passive: true });
    const params = new URLSearchParams(window.location.search);
    const index = fragrances.findIndex((item) => item.slug === params.get("scent"));
    if (index >= 0) {
      setCurrent(index);
      setOffset(index);
      setView("detail");
    }
    try { if (sessionStorage.getItem("ecorce-intro-seen")) setIntro(false); } catch { /* disabled storage */ }
    const onPop = () => {
      const slug = new URLSearchParams(window.location.search).get("scent");
      const nextIndex = fragrances.findIndex((item) => item.slug === slug);
      if (nextIndex >= 0) {
        setCurrent(nextIndex);
        setOffset(nextIndex);
        setView("detail");
      } else setView("home");
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("popstate", onPop); };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ duration: 1.2, smoothWheel: true, wheelMultiplier: 0.85 });
    const raf = (seconds: number) => lenis?.raf(seconds * 1000);
    lenis?.on("scroll", ScrollTrigger.update);
    if (lenis) gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const context = gsap.context(() => {
      if (!reduced) {
        gsap.fromTo(".enter-up", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.25, stagger: 0.11, ease: "power3.out", clearProps: "transform,opacity" });
        gsap.utils.toArray<HTMLElement>(".reveal-on-scroll").forEach((element) => {
          gsap.fromTo(element, { y: 55, opacity: 0 }, {
            y: 0, opacity: 1, duration: 1.15, ease: "power2.out", clearProps: "transform,opacity",
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>(".tunnel-word").forEach((element, index) => {
          gsap.fromTo(element, { z: -500, opacity: 0.05, scale: 0.45 }, {
            z: 350, opacity: 1, scale: 1.8, ease: "none",
            scrollTrigger: { trigger: ".tunnel", start: `top+=${index * 160} bottom`, end: `bottom-=${index * 55} top`, scrub: true },
          });
        });
      }
    }, rootRef);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      context.revert();
      gsap.ticker.remove(raf);
      lenis?.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [view]);

  useEffect(() => {
    if (intro || view !== "home") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") { event.preventDefault(); setOffset((value) => clamp(Math.round(value) + 1, 0, fragrances.length - 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setOffset((value) => clamp(Math.round(value) - 1, 0, fragrances.length - 1)); }
      if (event.key === "Enter" && document.activeElement === carouselRef.current) openScent(activeIndex);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // openScent uses the active index in its call; listener is recreated when index changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, intro, activeIndex]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openScent = (index: number) => {
    const next = clamp(index, 0, fragrances.length - 1);
    setCurrent(next);
    setOffset(next);
    setView("detail");
    window.history.pushState({ scent: fragrances[next].slug }, "", `?scent=${fragrances[next].slug}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const goHome = () => {
    setView("home");
    window.history.pushState({}, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const startHold = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    holdStart.current = performance.now();
    const frame = () => {
      const progress = clamp(((performance.now() - holdStart.current) / 1150) * 100, 0, 100);
      setHold(progress);
      if (progress >= 100) finishIntro();
      else holdFrame.current = requestAnimationFrame(frame);
    };
    holdFrame.current = requestAnimationFrame(frame);
  };
  const stopHold = () => {
    if (holdFrame.current !== null) cancelAnimationFrame(holdFrame.current);
    holdFrame.current = null;
    if (intro) setHold(0);
  };

  const onCarouselDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, offset, lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false };
  };
  const onCarouselMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pillRef.current && carouselRef.current) {
      const rect = carouselRef.current.getBoundingClientRect();
      pillRef.current.style.transform = `translate3d(${event.clientX - rect.left + 18}px,${event.clientY - rect.top + 18}px,0)`;
    }
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (!drag.moved) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const now = performance.now();
    const dt = Math.max(now - drag.lastTime, 1);
    drag.velocity = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX;
    drag.lastTime = now;
    setOffset(clamp(drag.offset - dx / (width < 640 ? 115 : 175), 0, fragrances.length - 1));
  };
  const onCarouselUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      const displacement = (-drag.velocity * 120) / (width < 640 ? 115 : 175);
      setOffset((value) => clamp(Math.round(value + displacement), 0, fragrances.length - 1));
    }
    dragRef.current = null;
  };

  const slotStyle = (index: number): CSSProperties => {
    const delta = index - offset;
    const spacing = width < 640 ? 108 : width < 950 ? 155 : 204;
    const rise = width < 640 ? 52 : 70;
    const x = delta * spacing;
    const y = -delta * rise + Math.abs(delta) * Math.abs(delta) * 7;
    const scale = Math.max(0.45, 1 - Math.abs(delta) * 0.095);
    return {
      transform: `translate3d(calc(-50% + ${x}px),calc(-50% + ${y}px),0) scale(${scale})`,
      opacity: Math.abs(delta) > (width < 640 ? 2.55 : 4.6) ? 0 : 1,
      pointerEvents: Math.abs(delta) > (width < 640 ? 2.55 : 4.6) ? "none" : "auto",
      zIndex: Math.round(15 - Math.abs(delta)),
    };
  };

  const others = useMemo(() => fragrances.filter((item) => item.slug !== scent.slug), [scent.slug]);
  const collection = useMemo(() => fragrances.filter((item) => {
    if (family === "All") return true;
    const words = (item.category + " " + item.notes.join(" ")).toLowerCase();
    if (family === "Floral") return /floral|rose|iris|gardenia|neroli|violet/.test(words);
    if (family === "Woody") return /woody|wood|cedar|vetiver|hinoki|leather/.test(words);
    if (family === "Amber") return /amber|resin|spic|oud|saffron|labdanum/.test(words);
    return /fresh|green|marine|mineral|fig|juniper|sea/.test(words);
  }), [family]);
  const suggestedIndex = quizMood === "Romantic" ? (quizMoment === "Daylight" ? 5 : 0)
    : quizMood === "Grounded" ? (quizMoment === "Daylight" ? 4 : 9)
    : quizMood === "Effortless" ? (quizMoment === "Daylight" ? 7 : 3)
    : (quizMoment === "Daylight" ? 6 : 2);
  const suggested = fragrances[suggestedIndex];

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setToast("Email copied — this is a concept address");
    } catch {
      setToast(EMAIL);
    }
  };

  return (
    <div className={`site site--${view}`} ref={rootRef}>
      <div className="grain" aria-hidden="true" />
      <BottleScene view={view} selectedSlug={scent.slug} />

      {intro && (
        <section className="intro-screen" aria-label="Enter the Écorce perfume experience">
          <div className="intro-top"><span>MAISON DE PARFUM</span><span>EST. IN IMAGINATION</span></div>
          <div className="intro-center">
            <span className="eyebrow intro-eyebrow">WELCOME TO THE HOUSE</span>
            <h1>ÉCORCE<span className="intro-dot">.</span></h1>
            <p>Ten scents. A thousand memories.</p>
            <div className="intro-mist" style={{ opacity: hold / 105, transform: `translate(-50%, -50%) scale(${1 + hold / 27})` }} aria-hidden="true" />
            <button className="hold-button" onPointerDown={startHold} onPointerUp={stopHold} onPointerCancel={stopHold} onLostPointerCapture={stopHold} aria-label="Press and hold for one second to enter">
              <span className="hold-ring" style={{ background: `conic-gradient(var(--red) ${hold}%, rgba(110,26,30,.13) ${hold}% 100%)` }}><span>✳</span></span>
              <span>PRESS &amp; HOLD TO UNVEIL</span>
            </button>
            <button className="text-button intro-skip" onClick={finishIntro}>Skip introduction <ArrowIcon /></button>
          </div>
          <span className="intro-edition">AN OLFACTORY JOURNEY — VOL. 01</span>
        </section>
      )}

      <header className="nav-bar">
        <button className="brand" onClick={goHome} aria-label="Écorce — return home">ÉCORCE<span>✳</span></button>
        <span className="nav-center">MAISON DE PARFUM <i>·</i> PARIS, IMAGINED</span>
        <div className="nav-actions">
          <button className="nav-link" onClick={view === "home" ? () => document.getElementById("the-edit")?.scrollIntoView({ behavior: "smooth" }) : goHome}>
            {view === "home" ? "THE COLLECTION" : "← ALL SCENTS"}
          </button>
          <button className="bag-button" onClick={() => setToast(`Demo bag: ${demoBag} ${demoBag === 1 ? "sample" : "samples"}. Checkout is not enabled.`)} aria-label={`Demo bag, ${demoBag} items`}>
            BAG <span>{String(demoBag).padStart(2, "0")}</span>
          </button>
        </div>
      </header>

      {view === "home" ? (
        <main>
          <section className="home-hero" id="collection">
            <div className="hero-topline enter-up"><span>AN EXPLORATION IN TEN PARTS</span><span>EXTRAITS DE PARFUM / NO. 01—10</span></div>
            <div className="hero-headline enter-up" aria-hidden="true"><span>THE ART OF</span><em>feeling</em></div>
            <div className="seal" aria-hidden="true">
              <div className="seal-outline" />
              <div className="seal-inner"><span>✳</span></div>
              <svg viewBox="0 0 300 300" className="seal-ring"><defs><path id="seal-text" d="M 150,150 m -118,0 a 118,118 0 1,1 236,0 a 118,118 0 1,1 -236,0" /></defs><text><textPath href="#seal-text">DISTILLED FROM NATURE ✳ MADE TO BE REMEMBERED ✳ </textPath></text></svg>
            </div>
            <div className="carousel" ref={carouselRef} tabIndex={0} role="region" aria-label="Fragrance carousel; drag or use arrow keys" onPointerDown={onCarouselDown} onPointerMove={onCarouselMove} onPointerUp={onCarouselUp} onPointerCancel={onCarouselUp} onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
              {fragrances.map((item, index) => (
                <button
                  key={item.slug}
                  className={`carousel-item ${Math.abs(index - offset) < 0.48 ? "is-active" : ""}`}
                  style={slotStyle(index)}
                  aria-label={`Explore ${item.name}, ${item.category}`}
                  onClick={() => { if (!dragRef.current?.moved) openScent(index); }}
                >
                  <BottleAnchor scent={item} variant="carousel" />
                  <span className="carousel-item-label"><small>NO. {item.number}</small><strong>{item.name}</strong></span>
                </button>
              ))}
              <span ref={pillRef} className={`view-pill ${hovering ? "is-visible" : ""}`} aria-hidden="true">VIEW <ArrowIcon /></span>
            </div>
            <div className="carousel-bottom enter-up">
              <div className="carousel-step"><span>SCENT {featured.number}</span><span className="step-track"><span style={{ width: `${((activeIndex + 1) / fragrances.length) * 100}%` }} /></span><span>10</span></div>
              <div className="carousel-feature"><span className="eyebrow">CURRENTLY EXPLORING</span><h2>{featured.name}</h2><p>{featured.category}</p></div>
              <div className="carousel-controls">
                <button aria-label="Previous perfume" disabled={activeIndex === 0} onClick={() => setOffset(clamp(activeIndex - 1, 0, 9))}><ArrowIcon direction="left" /></button>
                <button aria-label="Next perfume" disabled={activeIndex === 9} onClick={() => setOffset(clamp(activeIndex + 1, 0, 9))}><ArrowIcon /></button>
                <button className="explore-pill" onClick={() => openScent(activeIndex)}>EXPLORE SCENT <ArrowIcon /></button>
              </div>
            </div>
            <span className="scroll-note">SCROLL TO DISCOVER <span>↓</span></span>
          </section>

          <section className="editorial-feature">
            <div className="editorial-feature-image">
              <img src={PHOTO.rouge} alt="Real glass perfume bottle photographed in warm editorial light" loading="lazy" decoding="async" />
              <span className="image-credit">AN EDITORIAL STUDY IN GLASS &amp; LIGHT</span>
            </div>
            <div className="editorial-feature-copy">
              <span className="section-counter">01 / THE WORLD OF ÉCORCE</span>
              <div className="mini-asterisk">✳</div>
              <h2>Not just a fragrance.<br /><em>A feeling.</em></h2>
              <p>Some memories never fade. A first encounter. Sun on warm stone. The quiet intensity of a night that did not want to end. At ÉCORCE, every composition begins with that feeling.</p>
              <button className="underlined-link" onClick={() => document.getElementById("the-edit")?.scrollIntoView({ behavior: "smooth" })}>EXPLORE THE HOUSE <ArrowIcon /></button>
              <div className="editorial-stat"><b>10</b><span>OLFACTORY<br/>PORTRAITS</span><span className="editorial-stat-line"/></div>
            </div>
          </section>

          <section className="home-manifesto">
            <span className="eyebrow reveal-on-scroll">THE PHILOSOPHY</span>
            <h2 className="reveal-on-scroll">We don’t simply wear perfume.<br />We wear <em>the way we feel.</em></h2>
            <div className="manifesto-bottom reveal-on-scroll"><p>Born of bark, resin, blossom and memory. Ten olfactory portraits, each a world waiting to be entered.</p><button className="round-link" onClick={() => openScent(activeIndex)} aria-label={`Discover ${featured.name}`}><ArrowIcon /></button></div>
            <span className="manifesto-watermark" aria-hidden="true">É</span>
          </section>

          <section className="collection-edit" id="the-edit">
            <div className="section-topline"><span>03 / DISCOVER YOUR SCENT</span><span>THE ÉCORCE COLLECTION</span></div>
            <div className="collection-intro reveal-on-scroll">
              <div><span className="eyebrow">THE FRAGRANCE LIBRARY</span><h2>Find your <em>signature.</em></h2></div>
              <p>Ten distinct worlds. From luminous florals to woods that linger on skin. Explore the edit, then step inside the story behind each scent.</p>
            </div>
            <div className="collection-filters" role="group" aria-label="Filter fragrances">
              {familyOptions.map(item => <button key={item} className={family === item ? "filter-chip selected" : "filter-chip"} aria-pressed={family === item} onClick={() => setFamily(item)}>{item}</button>)}
              <span className="collection-count">{String(collection.length).padStart(2, "0")} SCENTS</span>
            </div>
            <div className="collection-grid">
              {collection.map((item) => (
                <button className="collection-card" key={item.slug} onClick={() => openScent(fragrances.indexOf(item))} style={{ "--card-hue": item.glow } as CSSProperties}>
                  <span className="collection-card-art">
                    <span className="card-sun" />
                    <BottleAnchor scent={item} variant="edit" />
                    <span className="card-corner">Nº {item.number} / 10</span>
                    <span className="card-explore">DISCOVER ↗</span>
                  </span>
                  <span className="collection-card-information"><span><strong>{item.name}</strong><small>{item.category}</small></span><span className="collection-card-arrow"><ArrowIcon/></span></span>
                  <span className="collection-card-notes">{item.notes.join(" · ")}</span>
                </button>
              ))}
            </div>
            <p className="collection-note">ÉCORCE is an original creative perfume concept. Product renders are illustrative; there is no live checkout.</p>
          </section>

          <section className="atelier-feature">
            <div className="atelier-feature-title"><span className="eyebrow">04 / THE ART OF PERFUMERY</span><h2>From raw material<br/>to <em>reverie.</em></h2><p>We believe the most memorable fragrance is built layer by layer—contrast, restraint and a lingering trace.</p></div>
            <div className="atelier-feature-photo"><img src={PHOTO.atelier} alt="Authentic perfume still-life in studio light" loading="lazy" decoding="async"/><span>THE PERFUMER'S PALETTE / VOL. 01</span></div>
            <div className="atelier-feature-bottom"><div><b>01.</b><strong>THE OPENING</strong><span>The impression that sparks curiosity.</span></div><div><b>02.</b><strong>THE HEART</strong><span>Everything intimate and unexpected.</span></div><div><b>03.</b><strong>THE TRAIL</strong><span>What remains long after the moment.</span></div></div>
          </section>

          <section className="olfactory-world">
            <div className="section-topline"><span>05 / A WORLD OF SENSATION</span><span>MADE TO BE REMEMBERED</span></div>
            <h2 className="reveal-on-scroll">The world is our <em>ingredient.</em></h2>
            <div className="olfactory-tiles">
              <button className="olfactory-tile olfactory-tile-floral" onClick={() => { setFamily("Floral"); document.getElementById("the-edit")?.scrollIntoView({behavior:"smooth"}); }}>
                <img src={PHOTO.floral} alt="Real perfume bottle in a delicate floral editorial" loading="lazy" decoding="async" />
                <span>01 / THE BEAUTIFUL</span><strong>Floral<br/><i>intimacy.</i></strong><small>DISCOVER FLORALS ↗</small>
              </button>
              <button className="olfactory-tile olfactory-tile-dark" onClick={() => { setFamily("Amber"); document.getElementById("the-edit")?.scrollIntoView({behavior:"smooth"}); }}>
                <img src={PHOTO.night} alt="Real perfume glass bottle photographed in dramatic shadows" loading="lazy" decoding="async" />
                <span>02 / THE UNFORGETTABLE</span><strong>Dark<br/><i>allure.</i></strong><small>DISCOVER AMBERS ↗</small>
              </button>
              <button className="olfactory-tile olfactory-tile-warm" onClick={() => { setFamily("Woody"); document.getElementById("the-edit")?.scrollIntoView({behavior:"smooth"}); }}>
                <img src={PHOTO.ritual} alt="Perfume bottle still life with warm rich textures" loading="lazy" decoding="async" />
                <span>03 / THE TIMELESS</span><strong>Quiet<br/><i>strength.</i></strong><small>DISCOVER WOODS ↗</small>
              </button>
            </div>
          </section>

          <section className="scent-finder">
            <div className="scent-finder-head"><span className="eyebrow">06 / YOUR OLFACTORY PORTRAIT</span><span className="star-symbol">✳</span><h2>A scent that feels<br/>like <em>you.</em></h2><p>Not sure where to start? Choose a feeling and a moment. We'll reveal a fragrance to explore.</p></div>
            <div className="scent-finder-controls">
              <div><span className="finder-label">01 — WHAT FEELS LIKE YOU?</span><div className="finder-options">{["Mysterious","Romantic","Grounded","Effortless"].map(option=><button key={option} className={option === quizMood ? "chosen" : ""} onClick={()=>setQuizMood(option)} aria-pressed={option === quizMood}>{option}</button>)}</div></div>
              <div><span className="finder-label">02 — WHEN DOES IT COME ALIVE?</span><div className="finder-options">{["Daylight","After dark"].map(option=><button key={option} className={option === quizMoment ? "chosen" : ""} onClick={()=>setQuizMoment(option)} aria-pressed={option === quizMoment}>{option}</button>)}</div></div>
              <div className="finder-result" aria-live="polite"><span>YOUR EDITOR'S PICK</span><h3>{suggested.name}</h3><p>{suggested.subtitle} · {suggested.category}</p><button className="action-pill" onClick={()=>openScent(suggestedIndex)}>EXPLORE THIS SCENT <ArrowIcon/></button></div>
            </div>
          </section>

          <section className="final-editorial">
            <div className="final-editorial-photo"><img src={PHOTO.ritual} alt="Editorial perfume photograph highlighting glass and golden light" loading="lazy" decoding="async"/></div>
            <div className="final-editorial-copy"><span className="eyebrow">07 / THE RITUAL</span><h2>The last detail.<br/><em>The first impression.</em></h2><p>Fragrance is a private luxury—a ritual performed for nobody but yourself. Find the notes that stay close. Leave a little mystery in the air.</p><button className="underlined-link" onClick={()=>openScent(0)}>STEP INTO THE SCENT <ArrowIcon/></button></div>
          </section>

          <section className="home-transition">
            <span className="eyebrow">EVERY SCENT IS A STORY</span>
            <p>Find the one that feels like <em>yours.</em></p>
            <button className="underlined-link" onClick={() => openScent(activeIndex)}>ENTER THE COLLECTION <ArrowIcon /></button>
          </section>
        </main>
      ) : (
        <main key={scent.slug}>
          <section className="product-hero" style={{ "--scent-glow": scent.glow } as CSSProperties}>
            <div className="product-intro-bar enter-up"><span>EXTRAIT DE PARFUM</span><span>01 / 10 — AN OLFACTORY PORTRAIT</span><span>50 ML · CONCEPT EDITION</span></div>
            <div className="product-title enter-up"><span>{scent.name.split(" ")[0]}</span><em>{scent.name.split(" ").slice(1).join(" ")}</em></div>
            <div className="sun-shadow" aria-hidden="true" />
            <div className="still-life-plinth" aria-hidden="true"><div className="plinth-top"/><div className="plinth-front"/></div>
            <div className="plant-shadow" aria-hidden="true">✺</div>
            <BottleAnchor scent={scent} variant="product" />
            <div className="hero-side-note"><span>NO. {scent.number} / 10</span><span>{scent.category.toUpperCase()}</span></div>
            <div className="product-hero-bottom enter-up">
              <div><span className="eyebrow">A STUDY IN SCENT</span><p>{scent.subtitle}</p></div>
              <button className="action-pill" onClick={() => document.getElementById("scent-story")?.scrollIntoView({ behavior: "smooth" })}>DISCOVER THE STORY <ArrowIcon /></button>
              <span className="down-cue">SCROLL TO EXPLORE ↓</span>
            </div>
          </section>

          <section className="story-section" id="scent-story">
            <div className="section-counter">01 / THE STORY</div>
            <div className="story-layout">
              <div className="story-intro reveal-on-scroll"><span className="eyebrow">THE MEMORY BEHIND THE SCENT</span><h2>Some things<br />are better <em>felt.</em></h2></div>
              <div className="story-body reveal-on-scroll"><p>{scent.story}</p><div className="story-divider"/><span>NOTES OF {scent.notes.join(" · ").toUpperCase()}</span></div>
            </div>
            <div className="story-word" aria-hidden="true">REMEMBER</div>
          </section>


          <section className="detail-editorial-story">
            <div className="detail-editorial-copy">
              <span className="section-counter">A CLOSER LOOK / ÉCORCE JOURNAL</span>
              <h2>Every bottle holds<br/>a <em>memory.</em></h2>
              <p>{scent.story}</p>
              <div className="detail-note-row"><span>THE FIRST IMPRESSION</span><strong>{scent.notes[0]}</strong></div>
              <div className="detail-note-row"><span>THE HEART</span><strong>{scent.notes[1]}</strong></div>
              <div className="detail-note-row"><span>THE LASTING TRAIL</span><strong>{scent.notes[2]}</strong></div>
            </div>
            <div className="detail-editorial-photo">
              <img src={Number(scent.number) % 2 ? PHOTO.rouge : PHOTO.floral} alt="Photographic inspiration: real perfume bottle in an editorial still life" loading="lazy" decoding="async" />
              <span>EDITORIAL PHOTOGRAPHY / VISUAL INSPIRATION</span>
            </div>
          </section>

          <section className="other-scents" id="other-scents">
            <div className="section-counter">02 / THE COLLECTION</div>
            <div className="other-top reveal-on-scroll"><div><span className="eyebrow">A HOUSE OF TEN</span><h2>Other <em>extraits.</em></h2></div><p>Every bottle contains another world.<br />Drag across to discover your next story.</p></div>
            <div className="other-scroller" role="region" aria-label="Other fragrances; scroll horizontally" tabIndex={0}>
              <div className="other-card other-yours"><div className="yours-frame"><span>✳</span><strong>YOURS</strong></div><small>YOU ARE HERE</small><strong>{scent.name}</strong></div>
              {others.map((item) => <button className="other-card" key={item.slug} onClick={() => openScent(fragrances.findIndex((candidate) => candidate.slug === item.slug))}>
                <BottleAnchor scent={item} variant="collection" />
                <small>NO. {item.number}</small><strong>{item.name}</strong><span>{item.category}</span>
              </button>)}
            </div>
            <div className="scroll-instruction">← DRAG OR SCROLL TO EXPLORE →</div>
          </section>

          <section className="tunnel">
            <div className="section-counter">03 / INTO THE SCENT</div>
            <div className="tunnel-stage" aria-hidden="true"><span className="tunnel-word tunnel-word-one">FEEL</span><span className="tunnel-word tunnel-word-two">EVERY</span><span className="tunnel-word tunnel-word-three">NOTE</span></div>
            <div className="tunnel-main"><span className="eyebrow">BEYOND THE VISIBLE</span><h2>Into the <em>scent.</em></h2><BottleAnchor scent={scent} variant="tunnel" /></div>
            <p className="tunnel-caption">Take a moment. Let the notes unfold.</p>
          </section>

          <section className="composition">
            <div className="section-counter">04 / THE COMPOSITION</div>
            <div className="composition-head reveal-on-scroll"><span className="eyebrow">THE ANATOMY OF A MEMORY</span><h2>Made of <em>moments.</em></h2><p>Six distinct notes, one unmistakable impression.</p></div>
            <div className="composition-orbit">
              <div className="composition-rings" aria-hidden="true" />
              <BottleAnchor scent={scent} variant="composition" />
              {scent.ingredients.map((note, i) => <div className={`note-pill note-pill--${i + 1}`} key={note}><span>0{i + 1}</span><strong>{note}</strong></div>)}
            </div>
            <div className="composition-foot"><span>OLFACTORY FAMILY</span><strong>{scent.category}</strong><span>EXTRAIT DE PARFUM</span></div>
          </section>

          <section className="editorial-gallery">
            <div className="section-counter">05 / WORN &amp; WANTED</div>
            <div className="gallery-head reveal-on-scroll"><span className="eyebrow">THE EMOTION OF SCENT</span><h2>Worn &amp; <em>wanted.</em></h2></div>
            <div className="gallery-rail" role="region" tabIndex={0} aria-label="Campaign photography; scroll horizontally">
              <figure className="campaign-photo campaign-photo--one"><div className="campaign-image"/><figcaption>01 — THE UNEXPECTED</figcaption></figure>
              <figure className="campaign-photo campaign-photo--two"><div className="campaign-image"/><figcaption>02 — THE MOMENT</figcaption></figure>
              <figure className="campaign-photo campaign-photo--three"><div className="campaign-image"/><figcaption>03 — THE MEMORY</figcaption></figure>
            </div>
            <p className="gallery-fine-print">Editorial imagery is illustrative placeholder photography.</p>
          </section>


          <section className="wearing-guide">
            <span className="section-counter">06 / THE RITUAL OF WEARING</span>
            <div className="wearing-layout"><div><h2>Wear it your <em>way.</em></h2><p>Fragrance changes as it settles on skin. Give each composition the space to reveal itself—first a spark, then a story, finally a beautiful trace.</p></div><div className="wearing-steps"><div><small>01 / FIRST SPRAY</small><h3>Let it breathe.</h3><p>Allow the opening notes to settle naturally.</p></div><div><small>02 / THE HEART</small><h3>Find your moment.</h3><p>Discover the quiet notes beneath the first impression.</p></div><div><small>03 / THE TRACE</small><h3>Make it yours.</h3><p>Wear it close. Leave an impression that feels personal.</p></div></div></div>
          </section>

          <section className="product-cta">
            <span className="eyebrow reveal-on-scroll">YOUR SCENT, YOUR STORY</span>
            <h2 className="reveal-on-scroll">Carry it <em>with you.</em></h2>
            <p>Extrait de parfum · 50 ml · Concept edition</p>
            <button className="action-pill action-pill--light" onClick={() => { setDemoBag((count) => count + 1); setToast(`${scent.name} added to demo bag — no checkout is available.`); }}>ADD TO DEMO BAG <ArrowIcon /></button>
            <span className="demo-disclaimer">A CREATIVE SHOWCASE. NO REAL PRODUCTS OR PAYMENTS.</span>
          </section>
        </main>
      )}

      <footer className="footer">
        <div className="footer-top"><span>MAISON DE PARFUM</span><span>IMAGINED WITH INTENTION</span></div>
        <div className="footer-content"><span className="eyebrow">LET’S MAKE SOMETHING MEMORABLE</span><h2>Leave a <em>trace.</em></h2><button className="footer-orb" onClick={copyEmail} aria-label="Copy concept contact address"><span>✳</span><small>COPY EMAIL</small></button></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} ÉCORCE — CONCEPT SHOWCASE</span><span>DESIGNED TO BE FELT, NOT JUST SEEN</span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>BACK TO TOP ↑</button></div>
        <div className="giant-wordmark" aria-hidden="true">ÉCORCE</div>
      </footer>
      {toast && <div className="toast" role="status">{toast}<button aria-label="Dismiss notice" onClick={() => setToast("")}>×</button></div>}
    </div>
  );
}
