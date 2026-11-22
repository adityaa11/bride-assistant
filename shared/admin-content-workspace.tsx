"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { AdminIcon, AdminWorkspaceFrame } from "@/shared/admin-workspace-frame";
import type { ContentImageMetadata } from "@/shared/content-image-store";
import type { ScenarioResult } from "@/shared/scenarios/contracts";
import styles from "./admin-content-workspace.module.css";

type Tab = "portfolio" | "testimonials" | "events";
type Content = NonNullable<Extract<ScenarioResult["readModel"], { surface: "admin" }>["adminContent"]>;
type RecordItem = Content["portfolio"][number] | Content["testimonials"][number] | Content["events"][number];
type ProposedAction = "add" | "edit" | "publish" | "unpublish" | "delete";
const portfolioImage = {
  "bridal-preparation": "/fixture-assets/m1-t15/bridal-preparation.png",
  "garden-celebration": "/fixture-assets/m1-t15/garden-celebration.png",
} as const;
const mediaUrl = (key: string) => `/api/fixtures/m1-t15/content-media/${key}`;

function ImageUploadField({ collection, existingImage, existingAlt, disabled }: { collection: Tab; existingImage?: string; existingAlt?: string; disabled: boolean }) {
  const label = collection === "portfolio" ? "portfolio" : collection === "testimonials" ? "testimoni" : "event";
  return <div className={styles.imageField}>
    <label htmlFor="content-image-alt">Teks alternatif foto (aksesibilitas)<input id="content-image-alt" name="imageAlt" maxLength={180} defaultValue={existingAlt ?? ""} disabled={disabled} placeholder="Deskripsi singkat isi foto" /></label>
    <label htmlFor="content-image">Foto {label} (JPG / PNG / WebP)<input id="content-image" name="contentImage" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} aria-describedby="content-image-help" /></label>
    <span id="content-image-help" className={styles.fieldHelp}>Maksimal 5 MB. {existingImage ? "Biarkan kosong untuk memakai foto saat ini." : "Foto disimpan hanya dalam fixture lokal."}</span>
    <div className={styles.imagePicker}>{existingImage ? <Image className={styles.imagePreview} src={existingImage} alt={existingAlt ?? "Foto konten saat ini"} width={320} height={194} unoptimized={existingImage.startsWith("/api/")} /> : <span>Belum ada foto dipilih</span>}</div>
  </div>;
}

const headings = {
  portfolio: { empty: "Belum ada portfolio", description: "Tambahkan foto dan cerita momen pengantin yang telah memberikan persetujuan.", add: "Tambah Portfolio" },
  testimonials: { empty: "Belum ada testimoni", description: "Tambahkan ulasan yang benar-benar diberikan oleh customer dan telah disetujui untuk dipublikasikan.", add: "Tambah Testimoni" },
  events: { empty: "Belum ada event", description: "Tambahkan agenda bridal fair, open house, atau kegiatan lain yang akan dipublikasikan di landing page.", add: "Tambah Event" },
} as const;

function StatusBadge({ publication }: { publication: "draft" | "published" }) {
  return <span className={`${styles.webState} ${publication === "published" ? styles.isLive : ""}`}>{publication === "published" ? "Published" : "Draft"}</span>;
}

function Stats({ items }: { items: readonly RecordItem[] }) {
  const published = items.filter((item) => item.publication === "published").length;
  return <div className={styles.webStats}>
    {([["Total konten", items.length, "Semua status"], ["Published", published, "Ditandai untuk tampil"], ["Draft", items.length - published, "Belum diterbitkan"]] as const).map(([label, count, detail]) => <div className={styles.webStat} key={label}><span>{label}</span><strong>{count}</strong><small>{detail}</small></div>)}
  </div>;
}

function ContentCard({ item, tab, onAction, uploadedImage }: { item: RecordItem; tab: Tab; onAction: (action: ProposedAction, item: RecordItem) => void; uploadedImage?: ContentImageMetadata }) {
  const event = tab === "events" ? item as Content["events"][number] : null;
  const portfolio = tab === "portfolio" ? item as Content["portfolio"][number] : null;
  const testimonial = tab === "testimonials" ? item as Content["testimonials"][number] : null;
  return <article className={styles.webCard}>
    {(tab !== "testimonials" || uploadedImage) && <div className={styles.webMedia}>{uploadedImage ? <Image src={mediaUrl(uploadedImage.storageKey)} alt={uploadedImage.altText} width={1610} height={977} sizes="(max-width: 485px) 100vw, (max-width: 1150px) 50vw, 33vw" unoptimized /> : event ? <span className={styles.eventTheme} aria-hidden="true">{event.theme}</span> : portfolio ? <Image src={portfolioImage[portfolio.imageAsset]} alt={portfolio.imageAlt} width={1610} height={977} sizes="(max-width: 485px) 100vw, (max-width: 1150px) 50vw, 33vw" /> : <AdminIcon name="image" />}</div>}
    <div className={styles.webCardBody}>
      <div className={styles.webCardMeta}><StatusBadge publication={item.publication} />{portfolio && <span className={styles.pill}>{portfolio.category}</span>}{event && <span className={styles.pill}>{event.date}</span>}{testimonial && <AdminIcon name="quote" />}</div>
      {testimonial ? <><p className={styles.webQuote}>“{testimonial.quote}”</p><strong className={styles.attribution}>{testimonial.attribution}</strong></> : <><h3>{item.title}</h3>{event && <p>{event.location}</p>}<p>{portfolio?.description ?? event?.description}</p></>}
      <div className={styles.webCardActions}>
        <button className={`${styles.btn} ${styles.small}`} type="button" onClick={() => onAction("edit", item)}><AdminIcon name="edit" /> Edit</button>
        <button className={`${styles.btn} ${styles.small} ${styles.subtle}`} type="button" onClick={() => onAction(item.publication === "published" ? "unpublish" : "publish", item)}>{item.publication === "published" ? "Unpublish" : "Publish"}</button>
        <button className={`${styles.btn} ${styles.small}`} type="button" onClick={() => onAction("delete", item)} aria-label={`Hapus ${item.title}`}><AdminIcon name="x" /> Hapus</button>
      </div>
    </div>
  </article>;
}

export function AdminContentWorkspace({ scenario, resultScenario, initialTab = "portfolio" }: { scenario: ScenarioResult; resultScenario: ScenarioResult; initialTab?: Tab }) {
  const content = scenario.readModel.surface === "admin" ? scenario.readModel.adminContent : undefined;
  const [tab, setTab] = useState<Tab>(initialTab);
  const [dialog, setDialog] = useState<{ action: ProposedAction; item?: RecordItem } | null>(null);
  const [result, setResult] = useState("");
  const [uploaded, setUploaded] = useState<Record<string, ContentImageMetadata>>({});
  const [uploadError, setUploadError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/fixtures/m1-t15/content-media", { cache: "no-store" }).then(async (response) => {
      if (response.ok && active) setUploaded(await response.json() as Record<string, ContentImageMetadata>);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => { if (dialog && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, [dialog]);
  if (!content) return null;

  const active = initialTab === "events" ? "events" : tab;
  const newRecordId = active === "testimonials" ? "testimonial-new" : active === "events" ? "event-new" : "portfolio-new";
  const isEvents = active === "events";
  const items = isEvents ? [...content.events].sort((a, b) => b.date.localeCompare(a.date)) : [...content[active]].reverse();
  const title = isEvents ? "Events" : "Portfolio & Testimonials";
  const open = (action: ProposedAction, item?: RecordItem) => { setResult(""); setUploadError(""); setDialog({ action, item }); };
  const close = () => { dialogRef.current?.close(); setDialog(null); };
  const propose = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog || busy) return;
    const form = new FormData(event.currentTarget);
    const recordId = dialog.item?.id ?? newRecordId;
    const prior = uploaded[recordId];
    const image = form.get("contentImage");
    setUploadError("");
    setBusy(true);
    try {
      if ((dialog.action === "add" || dialog.action === "edit") && image instanceof File && image.size) {
        const requestBody = new FormData();
        requestBody.set("image", image);
        requestBody.set("recordId", recordId);
        requestBody.set("altText", String(form.get("imageAlt") ?? ""));
        const response = await fetch(prior ? mediaUrl(prior.storageKey) : "/api/fixtures/m1-t15/content-media", { method: prior ? "PUT" : "POST", body: requestBody });
        if (!response.ok) throw new Error("Foto tidak dapat disimpan. Periksa jenis dan ukuran file, lalu coba lagi.");
        const metadata = await response.json() as ContentImageMetadata;
        setUploaded((current) => ({ ...current, [recordId]: metadata }));
        setResult(`${resultScenario.state.message} ${resultScenario.interaction.summary} Foto fixture tersimpan (${metadata.storageKey}).`);
      } else if (dialog.action === "delete" && prior) {
        const response = await fetch(`${mediaUrl(prior.storageKey)}?recordId=${encodeURIComponent(recordId)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Foto fixture tidak dapat dihapus. Coba lagi.");
        setUploaded((current) => { const next = { ...current }; delete next[recordId]; return next; });
        setResult(`${resultScenario.state.message} ${resultScenario.interaction.summary} Foto fixture dihapus.`);
      } else setResult(`${resultScenario.state.message} ${resultScenario.interaction.summary}`);
      close();
    } catch (error) { setUploadError(error instanceof Error ? error.message : "Foto fixture tidak dapat disimpan."); }
    finally { setBusy(false); }
  };
  return <AdminWorkspaceFrame active={title} scenarioId={scenario.scenarioId} scenarioVersion={scenario.version} eyebrow={isEvents ? "Website Content / Our events" : "Website Content / Our brides"} title={title} subtitle={isEvents ? "Publikasikan agenda kegiatan Ranur agar customer bisa melihat acara mendatang dan kegiatan sebelumnya." : "Kelola cerita, foto, dan testimoni customer yang mendapat izin untuk dipublikasikan."} action={<button className={`${styles.btn} ${styles.primary}`} type="button" onClick={() => open("add")}><AdminIcon name="plus" />{headings[active].add}</button>}>
    <div className={styles.webToolbar}>
      {isEvents ? <p className={styles.webIntro}>Tanggal kegiatan menentukan kategori Upcoming atau Past event di landing page.</p> : <div className={styles.webTabs} role="tablist" aria-label="Jenis konten"><button role="tab" aria-selected={active === "portfolio"} className={active === "portfolio" ? styles.active : ""} type="button" onClick={() => setTab("portfolio")}>Portfolio ({content.portfolio.length})</button><button role="tab" aria-selected={active === "testimonials"} className={active === "testimonials" ? styles.active : ""} type="button" onClick={() => setTab("testimonials")}>Testimonials ({content.testimonials.length})</button></div>}
      <button className={styles.btn} type="button" disabled title="No export in fixture review"><AdminIcon name="download" />Export JSON website</button>
    </div>
    <Stats items={items} />
    {items.length ? <div className={styles.webGrid}>{items.map((item) => <ContentCard key={item.id} item={item} tab={active} onAction={open} uploadedImage={uploaded[item.id]} />)}</div> : <div className={styles.webEmpty} role={scenario.state.kind === "error" ? "alert" : "status"}><AdminIcon name="sparkle" /><h2>{headings[active].empty}</h2><p>{scenario.state.kind === "error" ? scenario.state.message : headings[active].description}</p><button className={`${styles.btn} ${styles.primary}`} type="button" onClick={() => open("add")}><AdminIcon name="plus" />{headings[active].add}</button></div>}
    <div className={styles.hintbox}><AdminIcon name={isEvents ? "calendar" : "heart"} />{isEvents ? "Event yang diterbitkan akan tampil di bagian Events setelah konten diintegrasikan ke website customer." : "Konten berstatus Draft tidak masuk ke hasil export untuk website. Foto portfolio diperlukan sebelum dapat diterbitkan. Pastikan izin penggunaan foto dan kutipan customer sudah diperoleh."}</div>
    <p className={styles.fixtureNotice}>{scenario.provenance.label}</p>
    {result && <div className={styles.result} role="status">{result}{uploaded[newRecordId] && <Image src={mediaUrl(uploaded[newRecordId].storageKey)} alt={uploaded[newRecordId].altText} width={160} height={97} unoptimized />}</div>}
    <dialog className={styles.modal} ref={dialogRef} onClose={() => setDialog(null)} aria-labelledby="content-dialog-title">
      {dialog && <form onSubmit={propose}>
        <div className={styles.modalHead}><div><div className={styles.eyebrow}>Website Content / {active}</div><h2 id="content-dialog-title">{dialog.action === "add" ? headings[active].add : dialog.action === "edit" ? `Edit ${active}` : `${dialog.action} ${active}`}</h2><p className={styles.fixtureNotice}>Proposed fixture result only.</p></div><button className={`${styles.btn} ${styles.iconOnly}`} type="button" onClick={close} aria-label="Close">×</button></div>
        <div className={styles.modalBody}>{dialog.action === "add" || dialog.action === "edit" ? <>
          {active === "portfolio" && <><label>Judul portfolio *<input required maxLength={120} placeholder="Contoh: A beautiful intimate wedding" defaultValue={dialog.item?.title ?? ""} /></label><label>Kategori / label<input maxLength={60} placeholder="Wedding moments" defaultValue={dialog.item && "category" in dialog.item ? dialog.item.category : ""} /></label><label>Cerita singkat<textarea maxLength={500} rows={3} placeholder="Cerita momen pengantin..." defaultValue={dialog.item && "description" in dialog.item ? dialog.item.description : ""} /></label></>}
          {active === "testimonials" && <><label>Nama / atribusi customer *<input required maxLength={120} placeholder="Nama customer, sesuai persetujuan" defaultValue={dialog.item && "attribution" in dialog.item ? dialog.item.attribution : ""} /></label><label>Kutipan testimoni *<textarea required maxLength={800} rows={5} placeholder="Tuliskan pengalaman customer..." defaultValue={dialog.item && "quote" in dialog.item ? dialog.item.quote : ""} /></label><p className={styles.fieldHelp}>Publikasikan hanya kutipan asli yang telah disetujui customer.</p></>}
          {active === "events" && <><label>Nama event *<input required maxLength={120} placeholder="Contoh: Ranur Bridal Open House" defaultValue={dialog.item?.title ?? ""} /></label><div className={styles.formRow}><label>Tanggal event *<input required type="date" defaultValue={dialog.item && "date" in dialog.item ? dialog.item.date : ""} /></label><label>Simbol event<input maxLength={4} placeholder="✦" defaultValue={dialog.item && "theme" in dialog.item ? dialog.item.theme : "✦"} /></label></div><label>Lokasi<input maxLength={150} placeholder="Venue / kota / online" defaultValue={dialog.item && "location" in dialog.item ? dialog.item.location : ""} /></label><label>Deskripsi<textarea maxLength={600} rows={3} defaultValue={dialog.item && "description" in dialog.item ? dialog.item.description : ""} /></label></>}
          <ImageUploadField key={`${active}-${dialog.item?.id ?? "new"}`} collection={active} existingImage={uploaded[dialog.item?.id ?? newRecordId] ? mediaUrl(uploaded[dialog.item?.id ?? newRecordId].storageKey) : dialog.item && "imageAsset" in dialog.item ? portfolioImage[dialog.item.imageAsset] : undefined} existingAlt={uploaded[dialog.item?.id ?? newRecordId]?.altText ?? (dialog.item && "imageAlt" in dialog.item ? dialog.item.imageAlt : undefined)} disabled={busy} />
          <label className={styles.checklabel}><input type="checkbox" defaultChecked={dialog.item?.publication === "published"} /><span><strong>Published</strong> — konten siap ditampilkan pada website customer setelah sinkronisasi.</span></label>
        </> : <p>{dialog.item?.title}</p>}{uploadError && <p className={styles.fieldError} role="alert">{uploadError}</p>}{busy && <p className={styles.fieldHelp} role="status">Menyimpan foto fixture…</p>}</div>
        <div className={styles.modalFooter}><button className={styles.btn} type="button" onClick={close} disabled={busy}>Cancel</button><button className={`${styles.btn} ${styles.primary}`} type="submit" disabled={busy}>{busy ? "Menyimpan…" : dialog.action === "add" || dialog.action === "edit" ? "Simpan konten" : dialog.action}</button></div>
      </form>}
    </dialog>
  </AdminWorkspaceFrame>;
}
