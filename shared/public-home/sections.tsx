import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublishedContent, PublishedPromotion, PublicPackage, ScenarioState } from "@/shared/scenarios/contracts";
import type { PublicPackageDetail } from "@/shared/server/public-package-read";
import styles from "@/shared/public-home.module.css";

function Eyebrow({ children, line = false }: Readonly<{ children: ReactNode; line?: boolean }>) {
  return <p className={styles.eyebrow}>{line && <span aria-hidden="true" />}{children}</p>;
}

function SectionHeading({ eyebrow, children, description }: Readonly<{ eyebrow: string; children: ReactNode; description?: string }>) {
  return <><Eyebrow>{eyebrow}</Eyebrow><h2>{children}</h2>{description && <p className={styles.sectionDescription}>{description}</p>}</>;
}

export function HeroSection() {
  return <section className={styles.hero} id="home"><div className={`${styles.wrap} ${styles.heroGrid}`}><div className={styles.heroCopy}><Eyebrow line>PERSONAL BRIDE ASSISTANT SERVICE</Eyebrow><h1>Your day, <em>beautifully</em><br />taken care of.</h1><p>Hari pernikahanmu layak dinikmati sepenuh hati. Ranur Bridal Care hadir sebagai <b>jasa bride assistant</b> atau pendamping personal pengantin wanita, membantu detail-detail kecil agar kamu bisa fokus pada setiap momen berharga.</p><div className={styles.actions}><a className={styles.primaryAction} href="#products">EXPLORE OUR CARE <span aria-hidden="true">↗</span></a><a className={styles.secondaryAction} href="#about">GET TO KNOW US <span aria-hidden="true">↗</span></a></div><div className={styles.heroFacts} aria-label="Fokus pendampingan"><span className={styles.fact}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" /></svg>Personal, thoughtful assistance</span><span className={styles.fact}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 5c-2-2-5-2-7 0l-1 1-1-1C7 1 1 5 3 10c1 3 5 7 9 11 4-4 8-8 9-11 1-2 0-4-1-5z" /></svg>Made for the bride</span></div></div><HeroArtwork /></div></section>;
}

function HeroArtwork() {
  return <div className={styles.artPanel}><div className={styles.halo} /><span className={styles.star} aria-hidden="true">✦</span><Image className={styles.bride} src="/reference-assets/ranur-bride-hero.svg" width={560} height={640} alt="Ilustrasi bride Ranur dengan bunga" loading="eager" /><Image className={styles.seal} src="/reference-assets/ranur-hero-stamp.webp" width={190} height={160} alt="Ranur Bridal Care" /><p className={styles.signature}>with love, Ranur ♡</p></div>;
}

export function AboutSection() {
  const features = [
    ["✧", "Attire & accessories", "Membantu detail gaun, veil, dan aksesori pengantin."],
    ["♡", "Personal care", "Pendampingan kebutuhan pribadi sepanjang momen penting."],
    ["✦", "Gentle reminders", "Mengingatkan kebutuhan touch-up dan kesiapan prosesi."],
    ["↝", "Seamless transitions", "Membantu pengantin saat perpindahan antarprosesi."],
  ];

  return <section className={styles.about} id="about"><div className={`${styles.wrap} ${styles.aboutGrid}`}><div className={styles.aboutArt} aria-hidden="true"><Image src="/reference-assets/ui-reference/index-inline-svg-05-97ad9680cf23.svg" width={500} height={540} alt="" /><p>A LITTLE MORE CARE, A LOT MORE LOVE</p></div><div className={styles.aboutCopy}><SectionHeading eyebrow="01 / MEET RANUR">Karena pengantin juga perlu <em>didampingi.</em></SectionHeading><p>Di balik hari yang indah, ada banyak hal sederhana yang perlu diperhatikan. Dari merapikan veil, menjaga aksesori tetap siap, hingga memastikan kebutuhan pribadimu tidak terlewat di tengah rangkaian acara.</p><p>Ranur Bridal Care berfokus pada <b>pendampingan personal pengantin wanita</b> — bukan mengambil alih keseluruhan penyelenggaraan pernikahan, melainkan hadir dekat denganmu di momen yang paling berarti.</p><aside><strong>Bride Assistant ≠ Wedding Organizer</strong><p>Wedding Organizer mengoordinasikan jalannya acara secara menyeluruh. Bride Assistant berfokus pada kebutuhan dan kenyamanan pribadi pengantin, sehingga keduanya dapat saling melengkapi.</p></aside><div className={styles.features}>{features.map(([icon, title, copy]) => <div className={styles.feature} key={title}><span aria-hidden="true">{icon}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div></div></div></section>;
}

export function ContentSection({ items }: Readonly<{ items: readonly PublishedContent[] }>) {
  return <section className={styles.story} id="portfolio"><div className={styles.wrap}><div className={styles.storyHead}><div><SectionHeading eyebrow="02 / LITTLE MOMENTS, LASTING MEMORIES">Every bride has <em>her own story.</em></SectionHeading></div><p>Setiap cerita pengantin memiliki keindahannya sendiri. Temukan inspirasi dari momen-momen yang penuh perhatian dan kasih sayang.</p></div><PublishedCollection items={items.filter((item) => item.kind === "story")} emptyCopy="Cerita dan galeri momen pengantin akan hadir di sini." /></div></section>;
}

export function EventsSection({ items }: Readonly<{ items: readonly PublishedContent[] }>) {
  return <section className={styles.events} id="events"><div className={styles.wrap}><div className={styles.eventsHead}><div><SectionHeading eyebrow="03 / OUR LITTLE CALENDAR" description="Temukan informasi kegiatan dan agenda terbaru dari Ranur Bridal Care.">Meet us at <em>our events.</em></SectionHeading></div><div className={styles.filters} aria-label="Filter event"><button type="button" aria-pressed="true">All events</button><button type="button" aria-pressed="false">Upcoming</button><button type="button" aria-pressed="false">Past events</button></div></div><PublishedCollection items={items.filter((item) => item.kind === "event")} emptyCopy="Belum ada agenda kegiatan yang dijadwalkan." /></div></section>;
}

function PublishedCollection({ items, emptyCopy }: Readonly<{ items: readonly PublishedContent[]; emptyCopy: string }>) {
  if (!items.length) return <p className={styles.noResults}>{emptyCopy}</p>;
  return <div className={styles.contentGrid}>{items.map((item) => <article key={item.id}><p>{item.kind === "event" ? "OUR EVENT" : "OUR MOMENT"}</p><h3>{item.title}</h3><span>{item.body}</span></article>)}</div>;
}

export function PackagesSection({ packages, promotions, state, livePackages, liveError = false }: Readonly<{ packages: readonly PublicPackage[]; promotions: readonly PublishedPromotion[]; state: ScenarioState; livePackages?: readonly PublicPackageDetail[]; liveError?: boolean }>) {
  if (livePackages) return <section className={styles.products} id="products"><div className={styles.wrap}><div className={styles.productsIntro}><SectionHeading eyebrow="04 / OUR CARE COLLECTION" description="Kenali pilihan paket Bride Assistant yang tersedia untuk hari istimewamu.">A little care for <em>every kind of love.</em></SectionHeading></div><div className={styles.packageGrid}>{livePackages.length ? livePackages.map((pkg, index) => <article key={pkg.id}><strong className={styles.number}>{String(index + 1).padStart(2, "0")}.</strong><p>BRIDAL CARE</p><h3>{pkg.name}</h3><small>— &nbsp;{pkg.durationMinutes} menit</small><span>{pkg.description}</span><strong className={styles.basePrice}>Harga dasar {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(pkg.basePrice)}</strong><ul>{pkg.items.map((item) => <li key={item.id}>{item.name} · {item.type === "service" ? "Service" : "Action"}</li>)}</ul>{pkg.offer && <aside className={styles.packageOffer}><b>{pkg.offer.title}</b><span>{pkg.offer.type === "percentage" ? `${pkg.offer.value}%` : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(pkg.offer.value)} diskon · {pkg.offer.startsOn}–{pkg.offer.endsOn}</span><span>{pkg.offer.description}</span></aside>}<Link href={`/booking?packageId=${encodeURIComponent(pkg.id)}`}>PILIH PAKET <b aria-hidden="true">↗</b></Link></article>) : <p className={styles.empty} role={liveError ? "alert" : "status"}>{liveError ? "Paket belum dapat dimuat. Coba muat ulang halaman." : "Belum ada paket yang dipublikasikan. Pilihan booking belum tersedia."}</p>}</div></div></section>;
  return <section className={styles.products} id="products"><div className={styles.wrap}><div className={styles.productsIntro}><SectionHeading eyebrow="04 / OUR CARE COLLECTION" description="Kenali pilihan paket Bride Assistant yang dirancang untuk berbagai kebutuhan dan durasi acara. Setiap pilihan berfokus pada kenyamananmu sebagai pengantin.">A little care for <em>every kind of love.</em></SectionHeading></div>{state.kind !== "success" && <p className={styles.state} role={state.kind === "error" ? "alert" : "status"}>{state.message}</p>}<PromotionShowcase promotions={promotions} /><div className={styles.packageGrid}>{packages.length ? packages.map((pkg, index) => <PackageCard key={pkg.id} package={pkg} index={index} />) : <p className={styles.empty}>Tidak ada paket yang sedang dipublikasikan.</p>}</div>{packages.length > 0 && <p className={styles.catalogFoot}>Informasi harga, cakupan layanan, dan ketersediaan dapat dikonsultasikan bersama tim Ranur Bridal Care.</p>}</div></section>;
}

function PromotionShowcase({ promotions }: Readonly<{ promotions: readonly PublishedPromotion[] }>) {
  if (!promotions.length) return null;

  return <div className={styles.promotionShowcase}>{promotions.map((promotion) => <aside className={styles.promotion} key={promotion.id}><div><p className={styles.promotionLabel}>SPECIAL OFFER</p><h3>{promotion.title}</h3><p>{promotion.description}</p><p className={styles.promotionEnds}>Hingga {promotion.endsOn}</p></div><div className={styles.promotionValue}><strong>{promotion.value}</strong><small>DISCOUNT</small></div></aside>)}</div>;
}

function PackageCard({ package: pkg, index }: Readonly<{ package: PublicPackage; index: number }>) {
  return <article className={pkg.featured ? styles.featured : undefined}>{pkg.featured && <b className={styles.ribbon}>SIGNATURE CARE</b>}<strong className={styles.number}>{String(index + 1).padStart(2, "0")}.</strong><p>{pkg.category}</p><h3>{pkg.title}</h3><small>— &nbsp;{pkg.duration}</small><span>{pkg.description}</span><ul>{pkg.inclusions.map((item) => <li key={item}>{item}</li>)}</ul><a href="#booking">PILIH PAKET <b aria-hidden="true">↗</b></a></article>;
}

export function JourneySection() {
  const steps = [["01", "Explore your care", "Lihat pilihan paket dan tentukan durasi yang paling sesuai dengan kebutuhan acaramu."], ["02", "Tell us your story", "Siapkan tanggal, lokasi, dan detail yang ingin kamu konsultasikan bersama Ranur."], ["03", "Confirm the details", "Hubungi tim Ranur melalui kanal resmi untuk memastikan ketersediaan dan detail reservasi."]];
  return <section className={styles.process}><div className={styles.wrap}><div className={styles.productsIntro}><SectionHeading eyebrow="05 / THE LITTLE JOURNEY" description="Langkah sederhana untuk mulai menyiapkan pendampingan personal pengantin.">From hello to <em>your beautiful day.</em></SectionHeading></div><div className={styles.steps}>{steps.map(([number, title, copy]) => <article key={number}><i>{number}</i><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>;
}

export function BookingSection({ provenance }: Readonly<{ provenance: string }>) {
  const steps = [["01", "Choose your care", "Pilih paket pendampingan sesuai durasi dan kebutuhanmu."], ["02", "Prepare your details", "Siapkan tanggal, lokasi, serta rangkaian acara pernikahan."], ["03", "Let's talk", "Konsultasikan kebutuhan dan ketersediaan layanan bersama tim Ranur."]];
  return <section className={styles.booking} id="booking"><div className={`${styles.wrap} ${styles.bookingPanel}`}><div className={styles.bookingLeft}><div><SectionHeading eyebrow="06 / YOUR BOOKING JOURNEY">Your beautiful day, <em>our thoughtful care.</em></SectionHeading><p>Pilih layanan yang sesuai, siapkan tanggal acara, dan diskusikan kebutuhan pendampinganmu bersama Ranur.</p></div><small>Kami siap membantu mempersiapkan detail pendampingan yang sesuai dengan kebutuhan hari istimewamu.</small></div><div className={styles.bookingRight}><Eyebrow>YOUR BRIDAL JOURNEY</Eyebrow><h3>From your first hello ♡</h3><p>Tiga langkah sederhana untuk mulai memilih pendampingan hari pernikahanmu.</p><ol className={styles.journeySteps}>{steps.map(([number, title, copy]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><small>{copy}</small></div></li>)}</ol><div className={styles.bookingSummary}><div><span>Paket pilihan</span><strong>Belum ada paket dipilih</strong></div><div><span>Tanggal acara</span><strong>Diskusikan bersama tim Ranur</strong></div></div><div className={styles.bookingActions}><a className={styles.secondaryAction} href="#products">EXPLORE PACKAGES <span aria-hidden="true">↗</span></a><Link className={styles.primaryAction} href="/daftar">DAFTAR AKUN <span aria-hidden="true">↗</span></Link></div><small className={styles.disclaimer}>{provenance}</small></div></div></section>;
}

export function FaqSection() {
  const questions = [
    ["Apa itu Bride Assistant?", "Bride Assistant adalah pendamping personal pengantin wanita yang membantu kebutuhan pengantin selama persiapan dan berlangsungnya acara, seperti busana, aksesori, pengingat touch-up, dan kebutuhan pribadi."],
    ["Apa bedanya Bride Assistant dengan Wedding Organizer?", "Wedding Organizer biasanya menangani koordinasi keseluruhan acara, sementara Bride Assistant berfokus pada pengantin secara personal. Keduanya memiliki peran berbeda dan dapat bekerja bersama."],
    ["Apakah paket bisa disesuaikan dengan kebutuhan acara?", "Detail pendampingan dapat dikonsultasikan dan disesuaikan dengan kebutuhan acara, tergantung cakupan layanan serta ketersediaan tim Ranur."],
    ["Bagaimana cara melakukan booking?", "Kenali pilihan paket, siapkan tanggal dan lokasi acara, lalu hubungi tim Ranur melalui kanal komunikasi resmi untuk menanyakan jadwal dan detail reservasi."],
  ];
  return <section className={styles.faq}><div className={`${styles.wrap} ${styles.faqGrid}`}><div><SectionHeading eyebrow="A FEW LOVELY ANSWERS" description="Pertanyaan yang umum muncul saat memilih jasa pendamping pengantin wanita.">You might be <em>wondering...</em></SectionHeading></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>;
}
