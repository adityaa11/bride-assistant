"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./admin-booking-workspace.module.css";

const iconFile = "/reference-assets/ui-reference/bride-assistant-planner-standalone-v3-content-management-inline-svg-01-e88f0a139761.svg";

export type AdminSection =
  | "Overview"
  | "Bookings"
  | "Services & Actions"
  | "Master Packages"
  | "Customers"
  | "Availability"
  | "Portfolio & Testimonials"
  | "Events"
  | "Promotions";

export function AdminIcon({ name, small = false }: { name: string; small?: boolean }) {
  return <svg className={`${styles.icon} ${small ? styles.iconSmall : ""}`} aria-hidden="true"><use href={`${iconFile}#i-${name}`} /></svg>;
}

function Brand() {
  return <div className={styles.brand}><span className={styles.brandMark}>✳</span><span><span className={styles.brandName}>bride.</span><span className={styles.brandCaption}>ASSISTANT PLANNER</span></span></div>;
}

function NavigationContent({ active, collapsed = false, onNavigate }: { active: AdminSection; collapsed?: boolean; onNavigate?: () => void }) {
  return <>
    <div className={styles.sidebarScroll}>
    <div className={styles.sidebarLabel}>Workspace</div>
    <nav className={styles.navigation} aria-label="Navigasi utama">
      {([["Overview", "home", "#admin-workspace"], ["Bookings", "calendar", "/admin"], ["Services & Actions", "heart", "/admin/catalogue"], ["Master Packages", "package", "/admin/packages"], ["Customers", "users", "/admin/customers"], ["Availability", "clock", "/admin/availability"]] as const).map(([label, icon, href]) => <a key={label} aria-label={collapsed ? label : undefined} className={`${styles.nav} ${active === label ? styles.navActive : ""}`} data-label={collapsed ? label : undefined} href={href} onClick={onNavigate} title={collapsed ? label : undefined}><AdminIcon name={icon} /><span className={styles.navText}>{label}</span></a>)}
    </nav>
    <div className={styles.sidebarSeparator} /><div className={styles.sidebarLabel}>Website Content</div>
    <nav className={styles.navigation} aria-label="Kelola konten website">{([["Portfolio & Testimonials", "image", "/admin/content"], ["Events", "calendar", "/admin/events"], ["Promotions", "megaphone", "/admin/promotions"]] as const).map(([label, icon, href]) => <a aria-label={collapsed ? label : undefined} className={`${styles.nav} ${active === label ? styles.navActive : ""}`} data-label={collapsed ? label : undefined} href={href} key={label} onClick={onNavigate} title={collapsed ? label : undefined}><AdminIcon name={icon} /><span className={styles.navText}>{label}</span></a>)}</nav>
    </div>
    <div className={styles.sidebarBottom}><div className={styles.studio}><span className={styles.avatar}>B</span><span className={styles.studioText}><strong>My Bridal Studio</strong><small>Independent Bride Assistant</small></span></div></div>
  </>;
}

export function AdminWorkspaceFrame({ active, scenarioId, scenarioVersion, eyebrow, title, subtitle, action, children }: Readonly<{
  active: AdminSection;
  scenarioId: string;
  scenarioVersion: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileMenu = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = mobileMenu.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 931px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return <div className={`${styles.page} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`} data-scenario-id={scenarioId} data-scenario-version={scenarioVersion}>
    <a className="skip-link" href="#admin-workspace">Lewati ke workspace</a>
    <aside className={styles.sidebar} id="admin-sidebar"><Brand /><button aria-controls="admin-sidebar" aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? "Perluas menu admin" : "Ciutkan menu admin"} className={styles.sidebarToggle} onClick={() => setSidebarCollapsed((value) => !value)} title={sidebarCollapsed ? "Perluas menu admin" : "Ciutkan menu admin"} type="button"><AdminIcon name={sidebarCollapsed ? "chevron-right" : "chevron-left"} /></button><NavigationContent active={active} collapsed={sidebarCollapsed} /></aside>
    <header className={styles.mobileHeader}>
      <Brand />
      <button aria-controls="admin-mobile-menu" aria-expanded={menuOpen} aria-haspopup="dialog" aria-label="Buka menu modul" className={styles.menuButton} onClick={() => setMenuOpen(true)} type="button"><span aria-hidden="true" className={styles.burgerLines}><i /><i /><i /></span></button>
    </header>
    <dialog aria-label="Menu modul" className={styles.mobileMenu} id="admin-mobile-menu" onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }} onClose={() => setMenuOpen(false)} ref={mobileMenu}>
      <div className={styles.drawerHeader}><Brand /><button aria-label="Tutup menu modul" className={styles.menuButton} onClick={() => setMenuOpen(false)} type="button">×</button></div>
      <div className={styles.drawerNavigation}><NavigationContent active={active} onNavigate={() => setMenuOpen(false)} /></div>
    </dialog>
    <div className={styles.content}>
      <header className={styles.topbar}><div className={styles.breadcrumbs}>Bride Assistant Planner <span aria-hidden="true">/</span> <strong>{active}</strong></div><div className={styles.topActions}><span className={styles.todayLabel}><AdminIcon name="sparkle" small /> Made for your bridal moments</span><span className={styles.profileDot}>B</span></div></header>
      <main id="admin-workspace">
        <div className={styles.sectionTitle}><div><div className={styles.eyebrow}>{eyebrow}</div><h1>{title}<span className={styles.period}>.</span></h1><p className={styles.subtitle}>{subtitle}</p></div>{action}</div>
        {children}
      </main>
    </div>
  </div>;
}
