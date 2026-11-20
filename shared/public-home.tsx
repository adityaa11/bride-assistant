import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import styles from "@/shared/public-home.module.css";

const navigation = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Events", "#events"],
  ["Products", "#products"],
  ["Booking", "#booking"],
] as const;

export function PublicHome({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  if (scenario.readModel.surface !== "public") throw new Error("Public home requires a public fixture scenario.");

  const { readModel } = scenario;
  return <div className={styles.site} data-scenario-id={scenario.scenarioId} data-scenario-version={scenario.version}>
    <a className="skip-link" href="#main">Langsung ke konten</a>
    <p className={styles.topline}>PERSONAL BRIDAL CARE <span aria-hidden="true">✦</span> YOUR MOMENT, OUR HEART</p>
    <header className={styles.header}><div className={styles.wrap}><a className={styles.brand} href="#home" aria-label="Ranur Bridal Care, kembali ke Home"><img src="/reference-assets/ranur-header-logo.webp" width="57" height="56" alt="" /><span><strong>RANUR</strong><small>BRIDAL CARE</small></span></a><nav className={styles.nav} aria-label="Menu utama">{navigation.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</nav><div className={styles.account}><a href="#booking">Masuk</a><a className={styles.register} href="#booking">DAFTAR</a></div></div></header>
    <main id="main">
      <section className={styles.hero} id="home"><div className={`${styles.wrap} ${styles.heroGrid}`}><div className={styles.heroCopy}><p className={styles.eyebrow}><span aria-hidden="true" />PERSONAL BRIDE ASSISTANT SERVICE</p><h1>Your day, <em>beautifully</em><br />taken care of.</h1><p>Hari pernikahanmu layak dinikmati sepenuh hati. Ranur Bridal Care hadir sebagai <b>jasa bride assistant</b> atau pendamping personal pengantin wanita, membantu detail-detail kecil agar kamu bisa fokus pada setiap momen berharga.</p><div className={styles.actions}><a className={styles.primaryAction} href="#products">EXPLORE OUR CARE <span aria-hidden="true">↗</span></a><a className={styles.secondaryAction} href="#about">GET TO KNOW US <span aria-hidden="true">↗</span></a></div><div className={styles.heroFacts}><span>✧&nbsp; Personal, thoughtful assistance</span><span>♡&nbsp; Made for the bride</span></div></div><div className={styles.artPanel}><div className={styles.halo} /><span className={styles.star} aria-hidden="true">✦</span><img className={styles.bride} src="/reference-assets/ranur-bride-hero.svg" width="560" height="640" alt="Ilustrasi bride Ranur dengan bunga" /><img className={styles.seal} src="/reference-assets/ranur-hero-stamp.webp" width="190" height="160" alt="Ranur Bridal Care" /><p className={styles.signature}>with love, Ranur ♡</p></div></div></section>
      <div className={styles.divider} aria-label="Little details, cherished moments"><span aria-hidden="true">✦</span> Little details, cherished moments <span aria-hidden="true">✦</span></div>
      <section className={styles.about} id="about"><div className={`${styles.wrap} ${styles.split}`}><div><p className={styles.eyebrow}>ABOUT RANUR</p><h2>Care that lets you be fully present.</h2></div><p>Every published fixture is intentionally display-only. It gives a bride a clear sense of the care available, without creating an account, booking, or official service transition.</p></div></section>
      <section className={styles.events} id="events"><div className={styles.wrap}><p className={styles.eyebrow}>PUBLISHED MOMENTS</p><h2>Small details, cherished moments.</h2><div className={styles.contentGrid}>{readModel.publishedContent.map((item) => <article key={item.id}><p>{item.kind === "event" ? "EVENT" : "STORY"}</p><h3>{item.title}</h3><span>{item.body}</span></article>)}</div></div></section>
      <section className={styles.products} id="products"><div className={styles.wrap}><p className={styles.eyebrow}>OUR CARE</p><h2>Choose a presence that feels right for you.</h2>{scenario.state.kind !== "success" && <p className={styles.state} role={scenario.state.kind === "error" ? "alert" : "status"}>{scenario.state.message}</p>}<div className={styles.packageGrid}>{readModel.packages.length ? readModel.packages.map((pkg, index) => <article className={pkg.featured ? styles.featured : undefined} key={pkg.id}><p>{String(index + 1).padStart(2, "0")}. &nbsp;{pkg.category}</p><h3>{pkg.title}</h3><small>{pkg.duration}</small><span>{pkg.description}</span><ul>{pkg.inclusions.map((item) => <li key={item}>{item}</li>)}</ul><a href="#booking">PILIH PAKET <b aria-hidden="true">↗</b></a></article>) : <p className={styles.empty}>Tidak ada paket yang sedang dipublikasikan.</p>}</div></div></section>
      <section className={styles.booking} id="booking"><div className={`${styles.wrap} ${styles.bookingInner}`}><div><p className={styles.eyebrow}>YOUR MOMENT, YOUR WAY</p><h2>Begin with a little more ease.</h2></div><p>{scenario.provenance.label} {scenario.interaction.summary}</p></div></section>
    </main>
    <footer className={styles.footer}>✦ &nbsp; Little details, cherished moments &nbsp; ✦</footer>
  </div>;
}
