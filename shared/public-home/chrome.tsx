"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "@/shared/public-home.module.css";

const navigation = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Events", "#events"],
  ["Products", "#products"],
  ["Booking", "#booking"],
] as const;

function Brand() {
  return <a className={styles.brand} href="#home" aria-label="Ranur Bridal Care, kembali ke Home"><Image src="/reference-assets/ranur-header-logo.webp" width={57} height={56} alt="" /><span><strong>RANUR</strong><small>BRIDAL CARE</small></span></a>;
}

function NavigationLinks({ activeSection, onNavigate }: Readonly<{ activeSection: string; onNavigate?: () => void }>) {
  return <>{navigation.map(([label, href]) => <a href={href} key={label} onClick={onNavigate} aria-current={activeSection === href.slice(1) ? "page" : undefined}>{label}</a>)}</>;
}

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const menuId = useId();
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const sections = navigation.map(([, href]) => document.querySelector(href)).filter((section): section is HTMLElement => section instanceof HTMLElement);
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
    }, { rootMargin: "-15% 0px -68% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <header className={styles.header}>
    <div className={styles.wrap}>
      <Brand />
      <nav className={styles.nav} aria-label="Menu utama"><NavigationLinks activeSection={activeSection} /></nav>
      <div className={styles.account}><Link href="/masuk">Masuk</Link><Link className={styles.register} href="/daftar">DAFTAR</Link></div>
      <button className={styles.menuToggle} type="button" aria-expanded={isMenuOpen} aria-controls={menuId} aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"} onClick={() => setIsMenuOpen((open) => !open)}><span /><span /><span /></button>
    </div>
    <nav id={menuId} className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`} aria-label="Menu utama mobile" aria-hidden={!isMenuOpen}>
      <NavigationLinks activeSection={activeSection} onNavigate={closeMenu} />
    </nav>
  </header>;
}

export function PublicFooter() {
  return <footer className={styles.footer}>
    <div className={`${styles.wrap} ${styles.footerMain}`}>
      <div><Image src="/reference-assets/ranur-footer-logo.webp" width={220} height={179} alt="Ranur Bridal Care" /><p>A thoughtful personal companion for the moments you&apos;ll remember forever.</p></div>
      <div><h3>Explore</h3><nav aria-label="Tautan footer" className={styles.footerLinks}><NavigationLinks activeSection="" /></nav></div>
      <div><h3>Made for your moment</h3><p>Bride Assistant &amp; pendamping personal pengantin wanita.<br /><br />Temukan pilihan pendampingan yang sesuai untuk hari pernikahanmu.</p></div>
    </div>
    <div className={`${styles.wrap} ${styles.footerBottom}`}><span>© 2026 Ranur Bridal Care. All rights reserved.</span><span>Made with care, for the bride ♡</span></div>
  </footer>;
}
