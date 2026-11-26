"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminIcon, AdminWorkspaceFrame } from "./admin-workspace-frame";
import { adminCatalogueCommand } from "./server/admin-catalogue-actions";
import styles from "./admin-catalogue-live.module.css";

type Entity = "item" | "bundle" | "package" | "promotion";
type Row = Record<string, unknown> & { id: string; name?: string; title?: string; active: boolean; published?: boolean;
  catalogueIds?: string[]; bundleIds?: string[]; packageIds?: string[] };
type Data = { types: Record<string, unknown>[]; items: Record<string, unknown>[]; bundles: Record<string, unknown>[];
  packages: Record<string, unknown>[]; promotions: Record<string, unknown>[] };
type Editor = { entity: Entity; row?: Row; key: string };
const label: Record<Entity, string> = { item: "Service / Action", bundle: "Bundle", package: "Master Package", promotion: "Promotion" };
const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const selected = (form: FormData, name: string) => form.getAll(name).map(String);
const money = (value: unknown) => `Rp ${Number(value).toLocaleString("id-ID")}`;

function valuesFor(entity: Entity, form: FormData) {
  const common = { description: field(form, "description"), active: form.has("active") };
  if (entity === "item") return { ...common, catalogue_type_id: Number(field(form, "catalogue_type_id")), name: field(form, "name") };
  if (entity === "bundle") return { ...common, name: field(form, "name"), catalogueIds: selected(form, "catalogueIds") };
  if (entity === "package") return { ...common, name: field(form, "name"), duration_minutes: Number(field(form, "duration_minutes")),
    base_price: field(form, "base_price"), published: form.has("published"), catalogueIds: selected(form, "catalogueIds"), bundleIds: selected(form, "bundleIds") };
  return { ...common, title: field(form, "title"), discount_type: field(form, "discount_type"),
    discount_value: field(form, "discount_value"), starts_on: field(form, "starts_on"), ends_on: field(form, "ends_on"),
    published: form.has("published"), packageIds: selected(form, "packageIds") };
}

function EditorFields({ editor, data }: { editor: Editor; data: Data }) {
  const row = editor.row;
  const entity = editor.entity;
  return <>
    <div className={styles.fields}>
      <label>{entity === "promotion" ? "Judul promo" : "Nama"}<input name={entity === "promotion" ? "title" : "name"} required maxLength={120} defaultValue={String(row?.[entity === "promotion" ? "title" : "name"] ?? "")} /></label>
      {entity === "item" && <label>Jenis<select name="catalogue_type_id" required defaultValue={String(row?.catalogue_type_id ?? data.types[0]?.id ?? "")}>
        {data.types.map((type) => <option key={String(type.id)} value={String(type.id)}>{String(type.label)}</option>)}
      </select></label>}
      <label className={styles.wide}>Deskripsi<textarea name="description" maxLength={600} rows={3} defaultValue={String(row?.description ?? "")} /></label>
      {entity === "package" && <><label>Durasi (menit)<input name="duration_minutes" type="number" min={1} max={1440} required defaultValue={String(row?.duration_minutes ?? 180)} /></label>
        <label>Harga dasar (Rp)<input name="base_price" type="number" min={0} step="0.01" required defaultValue={String(row?.base_price ?? "0")} /></label></>}
      {entity === "promotion" && <><label>Jenis diskon<select name="discount_type" defaultValue={String(row?.discount_type ?? "percentage")}><option value="percentage">Persentase</option><option value="rupiah">Rupiah</option></select></label>
        <label>Nilai diskon<input name="discount_value" type="number" min={0.01} step="0.01" required defaultValue={String(row?.discount_value ?? "")} /></label>
        <label>Mulai berlaku<input name="starts_on" type="date" required defaultValue={String(row?.starts_on ?? "").slice(0, 10)} /></label>
        <label>Berakhir<input name="ends_on" type="date" required defaultValue={String(row?.ends_on ?? "").slice(0, 10)} /></label></>}
    </div>
    {entity === "bundle" && <Selection title="Service & Action dalam bundle" name="catalogueIds" rows={data.items as Row[]} checked={row?.catalogueIds ?? []} />}
    {entity === "package" && <><Selection title="Service & Action langsung" name="catalogueIds" rows={data.items as Row[]} checked={row?.catalogueIds ?? []} />
      <Selection title="Bundle dalam paket" name="bundleIds" rows={data.bundles as Row[]} checked={row?.bundleIds ?? []} /></>}
    {entity === "promotion" && <Selection title="Paket yang mendapat promo" name="packageIds" rows={data.packages as Row[]} checked={row?.packageIds ?? []} />}
    <div className={styles.checks}><label><input type="checkbox" name="active" defaultChecked={row?.active ?? true} /> Aktif</label>
      {(entity === "package" || entity === "promotion") && <label><input type="checkbox" name="published" defaultChecked={row?.published ?? false} /> Published</label>}</div>
  </>;
}

function Selection({ title, name, rows, checked }: { title: string; name: string; rows: Row[]; checked: string[] }) {
  return <fieldset className={styles.selection}><legend>{title}</legend>{rows.length ? <div className={styles.optionGrid}>{rows.map((row) =>
    <label key={row.id}><input type="checkbox" name={name} value={row.id} defaultChecked={checked.includes(row.id)} /> {row.name}</label>)}</div> : <p>Belum ada pilihan. Buat data terkait terlebih dahulu.</p>}</fieldset>;
}

export function AdminCatalogueLive({ kind, data, error }: { kind: "catalogue" | "packages" | "promotions"; data: Data | null; error: string | null }) {
  const router = useRouter();
  const [tab, setTab] = useState<"item" | "bundle">("item");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor) editorRef.current?.querySelector<HTMLInputElement>("input")?.focus(); }, [editor]);
  const entity: Entity = kind === "catalogue" ? tab : kind === "packages" ? "package" : "promotion";
  const allRecords = data ? (entity === "item" ? data.items : entity === "bundle" ? data.bundles : entity === "package" ? data.packages : data.promotions) as Row[] : [];
  const records = allRecords.filter((row) => `${row.name ?? row.title ?? ""} ${row.description ?? ""}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))
    && (entity !== "item" || typeFilter === "all" || String(row.catalogue_type_id) === typeFilter));
  const open = (target: Entity, row?: Row) => { setFailure(""); setEditor({ entity: target, row, key: crypto.randomUUID() }); };
  const execute = async (input: { entity: Entity; operation: "create" | "update" | "retire"; id?: string; requestKey?: string; values?: object }) => {
    setBusy(true); setFailure("");
    try {
      const result = await adminCatalogueCommand(input);
      if (!result.ok) {
        setFailure(result.code === "CONFLICT" ? "Perubahan bertentangan dengan data saat ini. Periksa jenis, hubungan, dan periode promo yang bertumpang tindih." :
          result.code === "NOT_FOUND" ? "Data tidak ditemukan. Muat ulang halaman." : result.code === "INVALID_INPUT" ? "Periksa kembali semua isian." :
          result.code === "FORBIDDEN" || result.code === "AUTHENTICATION_REQUIRED" ? "Sesi admin tidak berlaku. Masuk kembali." : "Penyimpanan gagal. Coba lagi.");
        return;
      }
      setNotice(`${label[input.entity]} tersimpan.`); setEditor(null); router.refresh();
    } catch { setFailure("Penyimpanan gagal. Coba lagi."); }
    finally { setBusy(false); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!editor) return;
    execute({ entity: editor.entity, operation: editor.row ? "update" : "create", id: editor.row?.id,
      requestKey: editor.key, values: valuesFor(editor.entity, new FormData(event.currentTarget)) }); };
  const retire = (row: Row) => { if (window.confirm(`Arsipkan ${String(row.name ?? row.title)}?`)) execute({ entity, operation: "retire", id: row.id }); };
  const active = kind === "catalogue" ? "Services & Actions" : kind === "packages" ? "Master Packages" : "Promotions";
  return <AdminWorkspaceFrame active={active} scenarioId="admin.durable" scenarioVersion="M3-T02" eyebrow={kind === "promotions" ? "Website Content / Special offers" : "Services / Master catalog"}
    title={kind === "catalogue" ? "Services & Actions" : kind === "packages" ? "Your lovely packages" : "Promotions"}
    subtitle={kind === "catalogue" ? "Create services and actions, then arrange them in reusable bundles." : kind === "packages" ? "Combine services and bundles into booking packages." : "Manage offers, dates and eligible packages."}
    action={<button type="button" className={styles.primary} disabled={!data || busy} onClick={() => open(entity)}><AdminIcon name="plus" /> New {label[entity]}</button>}>
    {kind === "catalogue" && data && <div className={styles.stats}>
      <div><span>Individual services &amp; actions</span><strong>{data.items.length}</strong></div>
      <div><span>Reusable bundles</span><strong>{data.bundles.length}</strong></div>
      <div><span>Master packages</span><strong>{data.packages.length}</strong></div>
    </div>}
    {kind === "catalogue" && <div className={styles.toolbar}><div className={styles.tabs} role="tablist" aria-label="Catalogue view"><button role="tab" aria-selected={tab === "item"} onClick={() => { setTab("item"); setEditor(null); setQuery(""); }} type="button">Individual items</button><button role="tab" aria-selected={tab === "bundle"} onClick={() => { setTab("bundle"); setEditor(null); setQuery(""); }} type="button">Bundles</button></div>
      <label className={styles.search}><span className={styles.visuallyHidden}>Search name / description</span><input type="search" placeholder="Search name / description" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      {tab === "item" && <select className={styles.filter} aria-label="Filter type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Service &amp; Action</option>{data?.types.map((type) => <option key={String(type.id)} value={String(type.id)}>{String(type.label)}</option>)}</select>}</div>}
    {error && <div className={styles.error} role="alert">Data belum dapat dimuat. Coba muat ulang halaman.</div>}
    {notice && <div className={styles.success} role="status">{notice}</div>}
    {failure && <div className={styles.error} role="alert">{failure}</div>}
    {data && !editor && (records.length ? <div className={`${styles.grid} ${entity === "item" || entity === "bundle" ? styles.twoColumns : ""}`}>{records.map((row) => <article className={styles.card} key={row.id}>
      <div className={styles.meta}><span>{entity === "item" ? data.types.find((type) => type.id === row.catalogue_type_id)?.label?.toString() ?? "Item" : label[entity]}</span><span>{row.active ? "Active" : "Archived"}{row.published !== undefined ? row.published ? " · Published" : " · Draft" : ""}</span></div>
      <h2>{String(row.name ?? row.title)}</h2><p>{String(row.description ?? "") || "Belum ada deskripsi."}</p>
      {entity === "item" && <p className={styles.detail}>{data.bundles.filter((entry) => ((entry as Row).catalogueIds ?? []).includes(row.id)).length} bundles · {data.packages.filter((entry) => ((entry as Row).catalogueIds ?? []).includes(row.id)).length} direct packages</p>}
      {entity === "package" && <p className={styles.detail}>{money(row.base_price)} · {String(row.duration_minutes)} menit</p>}
      {entity === "promotion" && <p className={styles.detail}>{String(row.starts_on).slice(0, 10)} – {String(row.ends_on).slice(0, 10)} · {row.discount_type === "percentage" ? `${row.discount_value}%` : money(row.discount_value)}</p>}
      {(entity === "bundle" || entity === "package" || entity === "promotion") && <div className={styles.inclusions}><strong>{entity === "bundle" ? "Items" : entity === "package" ? "Package composition" : "Applicable packages"}</strong>
        <p>{entity === "bundle" ? row.catalogueIds?.map((id) => (data.items as Row[]).find((entry) => entry.id === id)?.name ?? id).join(" · ") :
          entity === "package" ? [...(row.catalogueIds ?? []).map((id) => (data.items as Row[]).find((entry) => entry.id === id)?.name ?? id), ...(row.bundleIds ?? []).map((id) => (data.bundles as Row[]).find((entry) => entry.id === id)?.name ?? id)].join(" · ") :
          row.packageIds?.map((id) => (data.packages as Row[]).find((entry) => entry.id === id)?.name ?? id).join(" · ")}</p></div>}
      <div className={styles.actions}><button type="button" disabled={busy} onClick={() => open(entity, row)}>Edit</button><button type="button" disabled={busy || !row.active} onClick={() => retire(row)}>Archive</button></div>
    </article>)}</div> : <div className={styles.empty}><h2>{allRecords.length ? "No matching items" : `Belum ada ${label[entity]}`}</h2><p>{allRecords.length ? "Try a different search or filter." : "Buat data pertama untuk pilihan mendatang."}</p><button type="button" className={styles.primary} onClick={() => open(entity)}>Create {label[entity]}</button></div>)}
    {data && editor && <div className={styles.editor} ref={editorRef}><div className={styles.editorHead}><h2>{editor.row ? "Edit" : "Create"} {label[editor.entity]}</h2><button type="button" onClick={() => setEditor(null)} disabled={busy}>Close</button></div>
      <form onSubmit={submit}><EditorFields key={`${editor.entity}-${editor.row?.id ?? editor.key}`} editor={editor} data={data} /><div className={styles.actions}><button type="button" onClick={() => setEditor(null)} disabled={busy}>Cancel</button><button className={styles.primary} type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Save"}</button></div></form></div>}
  </AdminWorkspaceFrame>;
}
