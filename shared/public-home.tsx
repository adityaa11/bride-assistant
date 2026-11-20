import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import styles from "@/shared/public-home.module.css";

const navigation = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Events", "#events"],
  ["Products", "#products"],
  ["Booking", "#booking"],
] as const;

function RanurMark() {
  return <svg aria-hidden="true" className={styles.mark} viewBox="0 0 70 70"><circle cx="35" cy="35" r="32" /><path d="M20 50c13-1 22-7 22-18 0-8-6-13-14-13H18m10 0v32m0-16h9c11 0 17-5 17-13 0-7-5-12-14-12H28" /><path d="M43 46c6-9 10-11 15-10-5 3-8 7-8 14m-7-2c-2-8-6-12-12-13 5 4 7 8 6 14" /></svg>;
}

function BrideArtwork() {
  return <svg aria-label="Ilustrasi editorial pengantin dengan bunga" className={styles.artwork} viewBox="0 0 560 650" role="img">
    <defs><linearGradient id="gown" x1="0" x2="1"><stop stopColor="#fffdf9"/><stop offset=".5" stopColor="#f5e2dc"/><stop offset="1" stopColor="#fffaf7"/></linearGradient></defs>
    <path className={styles.archLine} d="M93 622V169c0-113 91-161 187-161s187 48 187 161v453" />
    <path className={styles.archLine} d="M116 622V178c0-97 75-143 164-143s164 46 164 143v444" />
    <path className={styles.hair} d="M219 219c4-80 38-119 79-119 55 0 96 41 89 130l-10 126H214z" />
    <ellipse className={styles.face} cx="295" cy="254" rx="55" ry="78" />
    <path className={styles.hair} d="M235 236c8 42 12 99-3 136l-22-14c-20-106 10-145 25-122m119 0c-7 48-8 92 12 137l21-15c17-97-5-142-23-122" />
    <path className={styles.neck} d="M278 314h35l11 55h-57z" />
    <path className={styles.gown} d="M211 369c25-13 48-19 84-18 33 0 59 8 84 20 42 74 64 158 87 251H126c23-93 41-177 85-253z" />
    <path className={styles.gownDetail} d="M175 618c42-109 63-189 86-238m119 238c-30-109-51-188-78-238M278 371c-5 83-3 165 4 247" />
    <g className={styles.flowers}><path d="M317 493c-19 43-28 75-28 115m28-115c23 36 39 72 45 112m-45-112c-32 13-52 29-70 53" /><circle cx="315" cy="483" r="13" /><circle cx="355" cy="470" r="12" /><circle cx="280" cy="473" r="11" /><g><path d="M315 472c-24-40 21-50 13-7 37-17 40 29 7 20 15 36-32 30-20 7-31 13-29-31 0-20-28-19 0-43 10-10-1-35 36-6 20z"/><path d="M355 460c-22-35 18-41 12-6 31-15 36 25 7 18 12 31-28 28-18 6-27 11-26-27 0-18-24-16 0-36 9-8 0-31 31-5 17z"/><path d="M280 464c-19-32 15-38 10-5 27-14 32 22 6 16 10 28-25 25-16 5-23 10-22-24 0-16-21-15 0-33 8-8 0-28 28-4 15z"/></g></g>
  </svg>;
}

export function PublicHome({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  if (scenario.readModel.surface !== "public") throw new Error("Public home requires a public fixture scenario.");

  const { readModel } = scenario;
  return <div className={styles.site} data-scenario-id={scenario.scenarioId} data-scenario-version={scenario.version}>
    <a className="skip-link" href="#main">Langsung ke konten</a>
    <p className={styles.topline}>PERSONAL BRIDAL CARE <span aria-hidden="true">✦</span> YOUR MOMENT, OUR HEART</p>
    <header className={styles.header}><div className={styles.wrap}><a className={styles.brand} href="#home" aria-label="Ranur Bridal Care, kembali ke Home"><RanurMark /><span><strong>RANUR</strong><small>BRIDAL CARE</small></span></a><nav className={styles.nav} aria-label="Menu utama">{navigation.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</nav><div className={styles.account}><a href="#booking">Masuk</a><a className={styles.register} href="#booking">DAFTAR</a></div></div></header>
    <main id="main">
      <section className={styles.hero} id="home"><div className={`${styles.wrap} ${styles.heroGrid}`}><div className={styles.heroCopy}><p className={styles.eyebrow}><span aria-hidden="true" />PERSONAL BRIDE ASSISTANT SERVICE</p><h1>Your day, <em>beautifully</em><br />taken care of.</h1><p>Hari pernikahanmu layak dinikmati sepenuh hati. Ranur Bridal Care hadir sebagai <b>jasa bride assistant</b> atau pendamping personal pengantin wanita, membantu detail-detail kecil agar kamu bisa fokus pada setiap momen berharga.</p><div className={styles.actions}><a className={styles.primaryAction} href="#products">EXPLORE OUR CARE <span aria-hidden="true">↗</span></a><a className={styles.secondaryAction} href="#about">GET TO KNOW US <span aria-hidden="true">↗</span></a></div><div className={styles.heroFacts}><span>✧&nbsp; Personal, thoughtful assistance</span><span>♡&nbsp; Made for the bride</span></div></div><div className={styles.artPanel}><BrideArtwork /><div className={styles.seal}><RanurMark /><strong>RANUR BRIDAL CARE</strong><small>BRIDE ASSISTANT SERVICE</small></div><p className={styles.signature}>with love, Ranur ♡</p></div></div></section>
      <section className={styles.about} id="about"><div className={`${styles.wrap} ${styles.split}`}><div><p className={styles.eyebrow}>ABOUT RANUR</p><h2>Care that lets you be fully present.</h2></div><p>Every published fixture is intentionally display-only. It gives a bride a clear sense of the care available, without creating an account, booking, or official service transition.</p></div></section>
      <section className={styles.events} id="events"><div className={styles.wrap}><p className={styles.eyebrow}>PUBLISHED MOMENTS</p><h2>Small details, cherished moments.</h2><div className={styles.contentGrid}>{readModel.publishedContent.map((item) => <article key={item.id}><p>{item.kind === "event" ? "EVENT" : "STORY"}</p><h3>{item.title}</h3><span>{item.body}</span></article>)}</div></div></section>
      <section className={styles.products} id="products"><div className={styles.wrap}><p className={styles.eyebrow}>OUR CARE</p><h2>Choose a presence that feels right for you.</h2>{scenario.state.kind !== "success" && <p className={styles.state} role={scenario.state.kind === "error" ? "alert" : "status"}>{scenario.state.message}</p>}<div className={styles.packageGrid}>{readModel.packages.length ? readModel.packages.map((pkg, index) => <article className={pkg.featured ? styles.featured : undefined} key={pkg.id}><p>{String(index + 1).padStart(2, "0")}. &nbsp;{pkg.category}</p><h3>{pkg.title}</h3><small>{pkg.duration}</small><span>{pkg.description}</span><ul>{pkg.inclusions.map((item) => <li key={item}>{item}</li>)}</ul><a href="#booking">PILIH PAKET <b aria-hidden="true">↗</b></a></article>) : <p className={styles.empty}>Tidak ada paket yang sedang dipublikasikan.</p>}</div></div></section>
      <section className={styles.booking} id="booking"><div className={`${styles.wrap} ${styles.bookingInner}`}><div><p className={styles.eyebrow}>YOUR MOMENT, YOUR WAY</p><h2>Begin with a little more ease.</h2></div><p>{scenario.provenance.label} {scenario.interaction.summary}</p></div></section>
    </main>
    <footer className={styles.footer}>✦ &nbsp; Little details, cherished moments &nbsp; ✦</footer>
  </div>;
}
