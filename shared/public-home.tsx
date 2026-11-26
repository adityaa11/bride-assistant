import { PublicFooter, PublicHeader } from "@/shared/public-home/chrome";
import {
  AboutSection,
  BookingSection,
  ContentSection,
  EventsSection,
  FaqSection,
  HeroSection,
  JourneySection,
  PackagesSection,
} from "@/shared/public-home/sections";
import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import styles from "@/shared/public-home.module.css";
import type { PublicPackageDetail } from "@/shared/server/public-package-read";

export function PublicHome({ scenarioId, livePackages, liveError = false }: Readonly<{ scenarioId: ScenarioId; livePackages?: readonly PublicPackageDetail[]; liveError?: boolean }>) {
  const scenario = getScenario(scenarioId);
  if (scenario.readModel.surface !== "public") throw new Error("Public home requires a public fixture scenario.");

  const { readModel } = scenario;

  return (
    <div className={styles.site} data-scenario-id={livePackages ? undefined : scenario.scenarioId} data-scenario-version={livePackages ? undefined : scenario.version}>
      <a className="skip-link" href="#main">Langsung ke konten</a>
      <p className={styles.topline}>PERSONAL BRIDAL CARE <span aria-hidden="true">✦</span> YOUR MOMENT, OUR HEART</p>
      <PublicHeader />
      <main id="main">
        <HeroSection />
        <div className={styles.divider} aria-label="Little details, cherished moments"><span aria-hidden="true">✦</span> Little details, cherished moments <span aria-hidden="true">✦</span></div>
        <AboutSection />
        <ContentSection items={readModel.publishedContent} />
        <EventsSection items={readModel.publishedContent} />
        <PackagesSection packages={readModel.packages} promotions={readModel.promotions} state={scenario.state} livePackages={liveError ? [] : livePackages} liveError={liveError} />
        <JourneySection />
        <BookingSection provenance={livePackages ? "Pilihan paket tersedia; pengajuan booking akan hadir setelah aktivasi alur berikutnya." : scenario.provenance.label} />
        <FaqSection />
      </main>
      <PublicFooter />
    </div>
  );
}
