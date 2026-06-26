import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export function useLandingAnimations() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Hero entrance animations
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

      heroTl
        .from("[data-gsap='hero-badge']", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
        })
        .from(
          "[data-gsap='hero-title']",
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.3"
        )
        .from(
          "[data-gsap='hero-subtitle']",
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          "[data-gsap='hero-cta']",
          {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
          },
          "-=0.4"
        )
        .from(
          "[data-gsap='hero-version']",
          {
            opacity: 0,
            duration: 0.5,
          },
          "-=0.2"
        )
        .from(
          "[data-gsap='hero-visual']",
          {
            x: 60,
            opacity: 0,
            scale: 0.95,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.8"
        );

      // Features section with ScrollTrigger
      if (featuresRef.current) {
        // Title animation
        gsap.from("[data-gsap='features-title']", {
          y: 40,
          opacity: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: "[data-gsap='features-title']",
            start: "top 85%",
            end: "top 60%",
            toggleActions: "play none none none",
          },
        });

        // Feature cards stagger animation
        gsap.from("[data-gsap='feature-card']", {
          y: 60,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-gsap='features-grid']",
            start: "top 80%",
            end: "top 40%",
            toggleActions: "play none none none",
          },
        });
      }

      // CTA section animation
      if (ctaRef.current) {
        gsap.from("[data-gsap='cta-content']", {
          y: 50,
          opacity: 0,
          scale: 0.98,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }
    },
    { scope: containerRef }
  );

  // Parallax effect on hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroSection = heroRef.current;
      if (heroSection && scrollY < heroSection.offsetHeight) {
        const canvas = heroSection.querySelector("canvas");
        if (canvas) {
          (canvas as HTMLElement).style.transform = `translateY(${scrollY * 0.3}px)`;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { containerRef, heroRef, featuresRef, ctaRef };
}
