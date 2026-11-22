"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AdminIcon, AdminWorkspaceFrame } from "@/shared/admin-workspace-frame";
import type { AdminReadModel, ScenarioResult } from "@/shared/scenarios/contracts";
import styles from "./admin-content-workspace.module.css";
import promo from "./admin-promotion-workspace.module.css";

type Promotions = NonNullable<AdminReadModel["adminPromotions"]>;
type Promotion = Promotions["records"][number];
type Action = "add" | "edit" | "publish" | "unpublish" | "delete";
const money = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;
const date = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

function PromotionStats({ records }: { records: Promotions["records"] }) {
  return <div className={styles.webStats}>
    {([["Total promo", records.length, "Semua periode"], ["Promo aktif", records.filter((record) => record.lifecycle === "Active").length, "Published dalam periode"], ["Draft", records.filter((record) => !record.published).length, "Belum diterbitkan"]] as const).map(([label, value, detail]) => <div className={styles.webStat} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>)}
  </div>;
}

function PromotionCard({ record, packages, onAction }: { record: Promotion; packages: Promotions["packages"]; onAction: (action: Action, record: Promotion) => void }) {
  const names = record.packageIds.map((id) => packages.find((entry) => entry.id === id)?.name ?? id);
  return <article className={styles.webCard}><div className={styles.webCardBody}>
    <div className={styles.webCardMeta}><span className={`${styles.webState} ${record.lifecycle === "Active" ? styles.isLive : record.lifecycle === "Scheduled" ? promo.future : record.lifecycle === "Ended" ? promo.ended : ""}`}>{record.lifecycle}</span><span className={promo.typePill}>{record.type === "percent" ? "Persentase" : "Nominal"}</span></div>
    <div className={promo.highlight}>{record.type === "percent" ? `${record.value}%` : money(record.value)}</div>
    <h3>{record.title}</h3><p>{record.description || "Belum ada deskripsi."}</p>
    <p><strong>Berlaku:</strong> {date(record.startDate)} – {date(record.endDate)}</p>
    <p><strong>Paket:</strong> {names.join(", ") || "Belum dipilih"}</p>
    <div className={styles.webCardActions}><button className={`${styles.btn} ${styles.small}`} type="button" onClick={() => onAction("edit", record)}><AdminIcon name="edit" /> Edit</button><button className={`${styles.btn} ${styles.small} ${styles.subtle}`} type="button" onClick={() => onAction(record.published ? "unpublish" : "publish", record)}>{record.published ? "Unpublish" : "Publish"}</button><button className={`${styles.btn} ${styles.small}`} aria-label={`Hapus ${record.title}`} type="button" onClick={() => onAction("delete", record)}><AdminIcon name="x" /> Hapus</button></div>
  </div></article>;
}

function PromotionEditor({ record, packages, onClose, onSubmit }: { record?: Promotion; packages: Promotions["packages"]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <><div className={styles.modalHead}><div><div className={styles.eyebrow}>Website Content / promotions</div><h2 id="promotion-dialog-title">{record ? "Edit promotions" : "Tambah promotions"}</h2></div><button className={`${styles.btn} ${styles.iconOnly}`} type="button" aria-label="Close" onClick={onClose}><AdminIcon name="x" /></button></div>
    <form onSubmit={onSubmit}><div className={`${styles.modalBody} ${promo.editorFields}`}>
      <label htmlFor="promo-title">Judul promo *<input id="promo-title" name="title" maxLength={120} required defaultValue={record?.title ?? ""} placeholder="Contoh: Special Wedding Month" /></label>
      <label htmlFor="promo-description">Detail penawaran<textarea id="promo-description" name="description" maxLength={600} rows={3} defaultValue={record?.description ?? ""} /></label>
      <div className={styles.formRow}><label htmlFor="promo-type">Jenis promo *<select className={promo.select} id="promo-type" name="type" defaultValue={record?.type ?? "percent"}><option value="percent">Diskon persentase (%)</option><option value="amount">Diskon nominal (Rp)</option></select></label><label htmlFor="promo-value">Nilai diskon *<input id="promo-value" name="value" type="number" min={1} step={1} required defaultValue={record?.value} placeholder="Contoh: 10" /></label></div>
      <div className={styles.formRow}><label htmlFor="promo-start">Mulai berlaku *<input id="promo-start" name="startDate" type="date" required defaultValue={record?.startDate} /></label><label htmlFor="promo-end">Berakhir *<input id="promo-end" name="endDate" type="date" required defaultValue={record?.endDate} /></label></div>
      <div className={promo.packageGroup}><strong>Paket yang mendapat promo *</strong><div className={promo.packagePick}>{packages.length ? packages.map((entry) => <label className={styles.checklabel} key={entry.id}><input type="checkbox" name="packageIds" value={entry.id} defaultChecked={record?.packageIds.includes(entry.id)} /><span>{entry.name} <small>· {money(entry.price)}</small></span></label>) : <p>Belum ada Master Package aktif. Buat paket terlebih dahulu.</p>}</div></div>
      <label className={styles.checklabel}><input type="checkbox" name="published" defaultChecked={record?.published} /><span><strong>Published</strong> — konten siap ditampilkan pada website customer setelah sinkronisasi.</span></label>
      <div className={styles.fieldHelp}>Promo ini bersifat informasi pada website; nominal harga booking tidak otomatis berubah.</div>
    </div><div className={styles.modalFooter}><button className={styles.btn} type="button" onClick={onClose}>Cancel</button><button className={`${styles.btn} ${styles.primary}`} type="submit"><AdminIcon name="check" /> Simpan konten</button></div></form></>;
}

export function AdminPromotionWorkspace({ scenario, resultScenario }: { scenario: ScenarioResult; resultScenario: ScenarioResult }) {
  const data = scenario.readModel.surface === "admin" ? scenario.readModel.adminPromotions : undefined;
  const [editor, setEditor] = useState<{ action: Action; record?: Promotion } | null>(null);
  const [result, setResult] = useState(scenario.scenarioId.endsWith("proposed-result") ? scenario.state.message : "");
  const [validation, setValidation] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (editor && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [editor]);
  if (!data) return null;
  const close = () => { dialog.current?.close(); setEditor(null); setValidation(""); };
  const act = (action: Action, record?: Promotion) => {
    setValidation("");
    if (action === "add" || action === "edit") { setEditor({ action, record }); return; }
    setResult(`${record?.title ?? "Promo"}: ${action === "delete" ? "Hapus" : action === "publish" ? "Publish" : "Unpublish"} — ${resultScenario.state.message} ${resultScenario.provenance.label}`);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type"));
    const value = Number(form.get("value"));
    const start = String(form.get("startDate"));
    const end = String(form.get("endDate"));
    if (!Number.isInteger(value) || value <= 0 || (type === "percent" && value > 100)) { setValidation("Periksa judul, jenis, dan nilai diskon (persentase maksimal 100%)."); return; }
    if (start > end) { setValidation("Periode promo tidak valid."); return; }
    if (form.getAll("packageIds").length === 0) { setValidation("Pilih minimal satu paket untuk promosi."); return; }
    setResult(`${resultScenario.state.message} ${resultScenario.provenance.label}`);
    close();
  };
  const records = [...data.records].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return <AdminWorkspaceFrame active="Promotions" scenarioId={scenario.scenarioId} scenarioVersion={scenario.version} eyebrow="Website Content / Special offers" title="Promotions" subtitle="Buat promo layanan dengan masa berlaku, nominal atau persentase, dan paket yang berlaku." action={<button className={`${styles.btn} ${styles.primary}`} type="button" onClick={() => act("add")}><AdminIcon name="plus" /> Tambah Promo</button>}>
    <div className={styles.webToolbar}><p className={styles.webIntro}>Promo disimpan sebagai informasi penawaran; tidak otomatis mengubah harga booking.</p><button className={styles.btn} type="button" disabled><AdminIcon name="download" /> Export JSON website</button></div>
    <PromotionStats records={records} />
    {records.length ? <div className={styles.webGrid}>{records.map((record) => <PromotionCard key={record.id} record={record} packages={data.packages} onAction={act} />)}</div> : <div className={styles.webEmpty}><AdminIcon name="sparkle" /><h2>{scenario.state.kind === "error" ? scenario.state.message : "Belum ada promotion"}</h2><p>Buat penawaran khusus dengan periode aktif dan pilih paket yang mendapatkan promo.</p><button className={`${styles.btn} ${styles.primary}`} type="button" onClick={() => act("add")}><AdminIcon name="plus" /> Tambah Promo</button></div>}
    <div className={styles.hintbox}><AdminIcon name="sparkle" /><span><strong>Aturan website:</strong> promo hanya ditampilkan saat berstatus Published dan tanggal hari ini berada di antara awal dan akhir periode. Nilai promo belum mengurangi harga pada checkout/booking.</span></div>
    <p className={styles.fixtureNotice}>{scenario.provenance.label}</p>
    {result && <div className={styles.result} role="status">{result}</div>}
    <dialog className={styles.modal} aria-labelledby="promotion-dialog-title" ref={dialog} onClose={() => setEditor(null)}>{editor && <PromotionEditor key={editor.record?.id ?? "new"} record={editor.record} packages={data.packages} onClose={close} onSubmit={submit} />}{validation && <div className={promo.toast} role="alert"><AdminIcon name="x" /> {validation}</div>}</dialog>
  </AdminWorkspaceFrame>;
}
