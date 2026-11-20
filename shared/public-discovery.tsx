import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import { EmptyState, StatusNotice } from "@/shared/ui-primitives";

const navigation = [
  ["Home", "#home"],
  ["About Us", "#about"],
  ["Stories", "#stories"],
  ["Events", "#events"],
  ["Products", "#products"],
] as const;

export function PublicDiscovery({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);

  if (scenario.readModel.surface !== "public") {
    throw new Error("Public discovery requires a public fixture scenario.");
  }

  const { readModel } = scenario;
  const stories = readModel.publishedContent.filter((item) => item.kind === "story");
  const events = readModel.publishedContent.filter((item) => item.kind === "event");

  return (
    <div className="public-site" data-scenario-id={scenario.scenarioId} data-scenario-version={scenario.version}>
      <a className="skip-link" href="#main">Langsung ke konten</a>
      <p className="public-topnote">PERSONAL BRIDAL CARE <span aria-hidden="true">✦</span> YOUR MOMENT, OUR HEART</p>
      <header className="public-header">
        <div className="public-wrap public-head">
          <a className="public-brand" href="#home" aria-label="Ranur Bridal Care, kembali ke Home"><span aria-hidden="true">R</span><strong>RANUR<small>BRIDAL CARE</small></strong></a>
          <nav className="public-menu" aria-label="Menu utama">{navigation.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</nav>
          <div className="public-account" aria-label="Akses akun fixture"><a href="#booking">Masuk</a><a className="public-register" href="#booking">Daftar <span aria-hidden="true">↗</span></a></div>
        </div>
      </header>
      <main id="main">
        <section className="public-hero" id="home" aria-labelledby="hero-title">
          <div className="public-wrap public-hero-grid">
            <div className="public-hero-copy"><p className="public-eyebrow"><span aria-hidden="true">✦</span> PERSONAL BRIDAL COMPANION</p><h1 id="hero-title">Your day, <em>beautifully</em> taken care of.</h1><p>From the quiet moments before the ceremony to the memories that stay long after, Ranur is here to make every part of your day feel effortless, personal, and entirely yours.</p><div className="public-actions"><a className="public-button public-button-primary" href="#products">Explore packages <span aria-hidden="true">↗</span></a><a className="public-text-link" href="#about">Discover Ranur <span aria-hidden="true">↓</span></a></div><div className="public-facts"><span>For the bride</span><span>Personal care</span><span>Quiet confidence</span></div></div>
            <div className="public-hero-art" aria-label="Editorial illustration of a bride and flowers"><div className="public-hero-halo" /><div className="public-hero-figure" aria-hidden="true"><i /><b /><span /></div><p className="public-art-stamp">WITH<br />CARE</p><p className="public-art-note">made for<br /><em>your moment</em></p></div>
          </div>
        </section>
        <section className="public-section" id="about" aria-labelledby="about-title"><div className="public-wrap public-about-grid"><div className="public-about-art"><span aria-hidden="true">✦</span><p>BRIDAL<br />CARE</p></div><div><p className="public-eyebrow">THE RANUR WAY</p><h2 id="about-title">A steady hand for the day you have imagined.</h2><p className="public-copy">Every bride deserves to feel present in her own moment. Our personal bridal companion stays close to the details so you can move through the day with ease.</p><div className="public-features"><p><b>01</b><span><strong>Thoughtful presence</strong>Support that feels calm, prepared, and personal.</span></p><p><b>02</b><span><strong>Details held gently</strong>From your veil to your personal essentials, nothing is left to chance.</span></p><p><b>03</b><span><strong>Space to be the bride</strong>A little more room to breathe, feel, and remember.</span></p></div></div></div></section>
        <section className="public-story-section" id="stories" aria-labelledby="stories-title"><div className="public-wrap"><p className="public-eyebrow">STORIES OF CARE</p><h2 id="stories-title">Small moments, held beautifully.</h2>{stories.length ? <div className="public-story-grid">{stories.map((item) => <article className="public-story" key={item.id}><div aria-hidden="true" /><h3>{item.title}</h3><p>{item.body}</p><a href="#booking">Read the story <span aria-hidden="true">↗</span></a></article>)}</div> : <EmptyState>No currently published stories are available.</EmptyState>}</div></section>
        <section className="public-events-section" id="events" aria-labelledby="events-title"><div className="public-wrap"><div className="public-events-head"><div><p className="public-eyebrow">GENTLE GATHERINGS</p><h2 id="events-title">Made for your moment.</h2></div><p>Thoughtful occasions and first conversations, shaped around what matters to you.</p></div>{events.length ? <div className="public-event-grid">{events.map((item) => <article key={item.id}><p className="public-eyebrow">PUBLISHED EVENT</p><h3>{item.title}</h3><p>{item.body}</p><a href="#booking">Learn more <span aria-hidden="true">↗</span></a></article>)}</div> : <EmptyState>No currently published events are available.</EmptyState>}</div></section>
        <section className="public-section public-products" id="products" aria-labelledby="products-title"><div className="public-wrap"><p className="public-eyebrow">PERSONAL BRIDAL CARE</p><h2 id="products-title">Choose the care that feels like you.</h2>{readModel.promotions.map((promotion) => <aside className="public-promotion" key={promotion.id}><div><p>SPECIAL OFFER</p><h3>{promotion.title}</h3><span>{promotion.description} · Until {promotion.endsOn}</span></div><b>{promotion.value}<small>DISCOUNT</small></b></aside>)}{readModel.packages.length ? <div className="public-product-grid">{readModel.packages.map((pkg, index) => <article className={pkg.featured ? "public-product public-product-featured" : "public-product"} key={pkg.id}>{pkg.featured && <p className="public-ribbon">SIGNATURE CARE</p>}<span className="public-product-number">{String(index + 1).padStart(2, "0")}.</span><p className="public-product-category">{pkg.category}</p><h3>{pkg.title}</h3><p className="public-hours">{pkg.duration}</p><p>{pkg.description}</p><ul>{pkg.inclusions.map((inclusion) => <li key={inclusion}>{inclusion}</li>)}</ul><a className={pkg.featured ? "public-button public-button-primary" : "public-button public-button-light"} href="#booking">Pilih paket <span aria-hidden="true">↗</span></a></article>)}</div> : <EmptyState>No currently published packages are available.</EmptyState>}</div></section>
        <section className="public-booking" id="booking" aria-labelledby="booking-title"><div className="public-wrap public-booking-panel"><div><p className="public-eyebrow">YOUR MOMENT, YOUR WAY</p><h2 id="booking-title">Let&apos;s begin with what you need.</h2><p>Choose a package to explore. This is a read-only review fixture and cannot create a booking, account, or official transition.</p></div><div className="public-booking-side"><StatusNotice state={scenario.state} /><a className="public-button public-button-light" href="#products">Explore packages <span aria-hidden="true">↗</span></a></div></div></section>
        <section className="public-faq"><div className="public-wrap public-faq-grid"><div><p className="public-eyebrow">A FEW QUESTIONS</p><h2>Care begins with clarity.</h2></div><dl><div><dt>What does a personal bridal companion do?</dt><dd>She stays close to the details that help your day feel calm, considered, and held.</dd></div><div><dt>Can I choose a package later?</dt><dd>Yes. This fixture keeps package exploration separate from any authoritative booking step.</dd></div></dl></div></section>
      </main>
      <footer className="public-footer"><div className="public-wrap public-footer-main"><div><a className="public-brand" href="#home" aria-label="Ranur Bridal Care, kembali ke Home"><span aria-hidden="true">R</span><strong>RANUR<small>BRIDAL CARE</small></strong></a><p>A thoughtful personal companion for the moments you&apos;ll remember forever.</p></div><div><h3>Explore</h3>{navigation.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</div><div><h3>Fixture boundary</h3><p>{scenario.provenance.label}</p><p>{scenario.interaction.summary}</p></div></div><div className="public-wrap public-footer-bottom"><span>© 2026 Ranur Bridal Care. All rights reserved.</span><span>Made with care, for the bride ♡</span></div></footer>
    </div>
  );
}
