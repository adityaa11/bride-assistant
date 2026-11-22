"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AdminIcon as Icon, AdminWorkspaceFrame } from "@/shared/admin-workspace-frame";
import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import type { AdminReadModel } from "@/shared/scenarios/contracts";
import styles from "./admin-catalogue-workspace.module.css";

type Catalogue = NonNullable<AdminReadModel["adminCatalogue"]>;
type Editor = { kind: "item" | "bundle" | "package"; id?: string };
const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export function AdminCatalogueWorkspace({ scenarioId }: { scenarioId: ScenarioId }) {
  const scenario = getScenario(scenarioId);
  const catalogue = scenario.readModel.surface === "admin" ? scenario.readModel.adminCatalogue : undefined;
  const packages = catalogue?.mode === "packages";
  const [tab, setTab] = useState<"items" | "bundles">("items");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "Service" | "Action">("all");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState(scenarioId.includes("proposed-result") ? scenario.state.message : "");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (editor && !element.open) element.showModal();
    if (!editor && element.open) element.close();
  }, [editor]);

  if (!catalogue) return null;
  const act = (label: string) => setNotice(`${label} tidak diterapkan. ${scenario.interaction.summary}`);
  const close = () => setEditor(null);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); act("Proposed edit result"); close(); };
  const items = catalogue.items.filter((item) => (type === "all" || type === item.type) && `${item.name} ${item.description}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")));
  const bundles = catalogue.bundles.filter((bundle) => `${bundle.name} ${bundle.description}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")));
  return <AdminWorkspaceFrame
    active={packages ? "Master Packages" : "Services & Actions"}
    scenarioId={scenario.scenarioId}
    scenarioVersion={scenario.version}
    eyebrow={packages ? "Services / Master packages" : "Services / Master catalog"}
    title={packages ? "Your lovely packages" : "Services & Actions"}
    subtitle={packages ? "Combine individual services, actions and reusable bundles into each booking package." : "Create individual services or actions, then group them into reusable bundles."}
    action={<button className={`${styles.btn} ${styles.primary}`} onClick={() => setEditor({ kind: packages ? "package" : tab === "items" ? "item" : "bundle" })} type="button"><Icon name="plus" />{packages ? "New Package" : tab === "items" ? "New Service / Action" : "New Bundle"}</button>}
  >
    {packages ? <PackageGrid catalogue={catalogue} emptyMessage={scenario.state.message} fixtureNotice={scenario.provenance.label} onEdit={(id) => setEditor({ kind: "package", id })} onAction={act} /> : <>
      <div className={styles.splitNote}><div className={styles.statCard}><span>Individual services &amp; actions</span><b>{catalogue.items.length}</b></div><div className={styles.statCard}><span>Reusable bundles</span><b>{catalogue.bundles.length}</b></div><div className={styles.statCard}><span>Master packages</span><b>{catalogue.packages.length}</b></div></div>
      <div className={styles.catalogToolbar}>
        <div className={styles.subtabs} role="tablist" aria-label="Catalog type"><button className={tab === "items" ? styles.active : ""} role="tab" aria-selected={tab === "items"} onClick={() => { setTab("items"); setQuery(""); }} type="button">Individual items</button><button className={tab === "bundles" ? styles.active : ""} role="tab" aria-selected={tab === "bundles"} onClick={() => { setTab("bundles"); setQuery(""); }} type="button">Bundles</button></div>
        <label className={styles.fieldSearch}><Icon name="search" /><span className={styles.visuallyHidden}>Search name / description</span><input className={styles.input} type="search" autoComplete="off" placeholder="Search name / description" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        {tab === "items" && <select className={styles.select} aria-label="Filter type" value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="all">Service &amp; Action</option><option value="Service">Services only</option><option value="Action">Actions only</option></select>}
      </div>
      <div className={styles.catalogGrid}>{tab === "items" ? items.map((item) => <article className={styles.catalogCard} key={item.id}><div className={styles.catalogMeta}><span className={`${styles.pill} ${item.type === "Service" ? styles.service : styles.action}`}>{item.type}</span><span className={styles.tiny}>{item.bundleCount} bundles · {item.packageCount} direct package(s)</span></div><h3>{item.name}</h3><p>{item.description}</p><div className={styles.cardTools}><button className={`${styles.btn} ${styles.small}`} onClick={() => setEditor({ kind: "item", id: item.id })} type="button"><Icon name="edit" />Edit</button><button className={`${styles.btn} ${styles.small}`} onClick={() => act("Delete")} type="button">Delete</button></div></article>) : bundles.map((bundle) => <article className={styles.catalogCard} key={bundle.id}><div className={styles.catalogMeta}><span className={`${styles.pill} ${styles.bundle}`}>Bundle</span><span className={styles.tiny}>{bundle.itemIds.length} item(s) · {bundle.packageCount} package(s)</span></div><h3>{bundle.name}</h3><p>{bundle.description}</p><div className={styles.miniChips}>{bundle.itemIds.map((id) => { const item = catalogue.items.find((entry) => entry.id === id); return item && <span className={`${styles.pill} ${item.type === "Service" ? styles.service : styles.action}`} key={id}>{item.name}</span>; })}</div><div className={styles.cardTools}><button className={`${styles.btn} ${styles.small}`} onClick={() => setEditor({ kind: "bundle", id: bundle.id })} type="button"><Icon name="edit" />Edit</button><button className={`${styles.btn} ${styles.small}`} onClick={() => act("Delete")} type="button">Delete</button></div></article>)}</div>
      {(tab === "items" ? items.length : bundles.length) === 0 && <div className={styles.empty}>{scenario.state.kind === "error" ? scenario.state.message : catalogue.items.length === 0 && catalogue.bundles.length === 0 ? scenario.state.message : "No matching items. Create one using the button above."}</div>}
      <div className={styles.hintbox}><Icon name="sparkle" /><span>{scenario.provenance.label}</span></div>
    </>}
    {notice && <div className={styles.toast} role="status"><Icon name="check" />{notice}</div>}
    <dialog className={styles.modal} ref={dialog} aria-label={editor ? `Proposed ${editor.kind} edit` : "Proposed edit"} onClose={close}>
      {editor && <EditorForm catalogue={catalogue} editor={editor} key={`${editor.kind}-${editor.id ?? "new"}`} onClose={close} onSubmit={submit} />}
    </dialog>
  </AdminWorkspaceFrame>;
}

function PackageGrid({ catalogue, emptyMessage, fixtureNotice, onEdit, onAction }: { catalogue: Catalogue; emptyMessage: string; fixtureNotice: string; onEdit: (id: string) => void; onAction: (label: string) => void }) {
  return <><div className={styles.packageGrid}>{catalogue.packages.map((pkg, index) => {
    const selected = pkg.selections.map((selection) => ({ selection, entry: selection.kind === "bundle" ? catalogue.bundles.find((bundle) => bundle.id === selection.id) : catalogue.items.find((item) => item.id === selection.id) })).filter((value) => value.entry);
    const ids = [...new Set(pkg.selections.flatMap((selection) => selection.kind === "bundle" ? catalogue.bundles.find((bundle) => bundle.id === selection.id)?.itemIds ?? [] : [selection.id]))];
    const included = ids.map((id) => catalogue.items.find((item) => item.id === id)).filter((item) => item !== undefined);
    return <article className={styles.packageCard} key={pkg.id}><div className={styles.packageTop}><span className={styles.packageNumber}>{String(index + 1).padStart(2, "0")}.</span><span className={`${styles.status} ${pkg.active ? styles.confirmed : styles.cancelled}`}>{pkg.active ? "Active" : "Inactive"}</span></div><h2 className={styles.packageTitle}>{pkg.name}</h2><p className={styles.packageDesc}>{pkg.description}</p><div><div className={styles.price}>{money(pkg.price)}</div><div className={styles.tiny}>{pkg.hours} jam pendampingan</div></div><div className={styles.packageInclusions}><div className={styles.detailLabel}>Package composition</div><div className={styles.miniChips}>{selected.map(({ selection, entry }) => <span className={`${styles.pill} ${selection.kind === "bundle" ? styles.bundle : "type" in entry! && entry!.type === "Service" ? styles.service : styles.action}`} key={`${selection.kind}-${selection.id}`}>{selection.kind === "bundle" ? "Bundle: " : ""}{entry!.name}</span>)}</div><div className={styles.tiny}>{included.length} unique included services / actions (expanded, duplicates removed)</div>{included.map((item) => <span className={styles.inclusion} key={item.id}><Icon name="check" />{item.name}</span>)}</div><button className={styles.btn} onClick={() => onEdit(pkg.id)} type="button"><Icon name="edit" />Edit package</button><button className={`${styles.btn} ${styles.small}`} onClick={() => onAction("Archive package")} type="button"><Icon name="x" />Archive package</button></article>;
  })}</div>{catalogue.packages.length === 0 && <div className={styles.empty}>{emptyMessage}</div>}<div className={styles.hintbox}><Icon name="sparkle" /><span>{fixtureNotice}</span></div></>;
}

function EditorForm({ catalogue, editor, onClose, onSubmit }: { catalogue: Catalogue; editor: Editor; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const item = catalogue.items.find((value) => value.id === editor.id);
  const bundle = catalogue.bundles.find((value) => value.id === editor.id);
  const pkg = catalogue.packages.find((value) => value.id === editor.id);
  const name = editor.kind === "item" ? item?.name : editor.kind === "bundle" ? bundle?.name : pkg?.name;
  const [lookup, setLookup] = useState("");
  const [itemLookup, setItemLookup] = useState("");
  const [selected, setSelected] = useState<string[]>(editor.kind === "bundle" ? [...(bundle?.itemIds ?? [])] : pkg?.selections.map((selection) => selection.id) ?? []);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const selectedItems = catalogue.items.filter((value) => selected.includes(value.id) || catalogue.bundles.some((entry) => selected.includes(entry.id) && entry.itemIds.includes(value.id)));
  const lookupRows = (entries: Catalogue["items"] | Catalogue["bundles"]) => entries.filter((entry) => `${entry.name} ${entry.description}`.toLocaleLowerCase("id-ID").includes(lookup.toLocaleLowerCase("id-ID")));
  return <form onSubmit={onSubmit}><div className={styles.modalHead}><div><div className={styles.eyebrow}>{editor.kind === "item" ? "Catalog / Individual item" : editor.kind === "bundle" ? "Master bundle" : "Master packages"}</div><h2>{editor.id ? `Edit ${editor.kind === "item" ? "service / action" : editor.kind}` : `Create ${editor.kind === "item" ? "service / action" : editor.kind === "bundle" ? "bundle" : "master package"}`}</h2></div><button className={`${styles.btn} ${styles.iconOnly}`} aria-label="Close" onClick={onClose} type="button"><Icon name="x" /></button></div><div className={styles.modalBody}>
    <label className={styles.formField}><span>{editor.kind === "item" ? "Nama service / action *" : editor.kind === "bundle" ? "Nama bundle *" : "Nama paket *"}</span><input className={styles.input} required maxLength={120} defaultValue={name ?? ""} placeholder={editor.kind === "item" ? "Contoh: Bridal Veil Arrangement" : editor.kind === "bundle" ? "Contoh: Essential Bridal Care" : "The ... Care"} /></label>
    {editor.kind === "item" && <label className={styles.formField}><span>Jenis *</span><select className={styles.select} defaultValue={item?.type ?? "Action"}><option>Service</option><option>Action</option></select><small>Service adalah bentuk layanan; Action adalah tindakan spesifik yang dilakukan BA.</small></label>}
    {editor.kind === "package" && <div className={styles.formRow}><label className={styles.formField}><span>Durasi (jam) *</span><input className={styles.input} type="number" min="1" max="24" required defaultValue={pkg?.hours ?? 3} /></label><label className={styles.formField}><span>Harga (Rp) *</span><input className={styles.input} type="number" min="0" step="1000" required defaultValue={pkg?.price ?? 0} /></label></div>}
    <label className={styles.formField}><span>{editor.kind === "item" ? "Deskripsi *" : editor.kind === "bundle" ? "Deskripsi" : "Deskripsi paket"}</span><textarea className={styles.input} rows={editor.kind === "item" ? 3 : 2} required={editor.kind === "item"} maxLength={editor.kind === "package" ? 500 : 350} defaultValue={editor.kind === "item" ? item?.description : editor.kind === "bundle" ? bundle?.description : pkg?.description} /></label>
    {editor.kind !== "item" && <><label className={styles.formField}><span>{editor.kind === "bundle" ? "Lookup individual service & action" : "Lookup bundles"}</span><input className={styles.input} type="search" placeholder={editor.kind === "bundle" ? "Search service atau action..." : "Cari bundle..."} value={lookup} onChange={(event) => setLookup(event.target.value)} /></label><div className={styles.selectionList}>{lookupRows(editor.kind === "bundle" ? catalogue.items : catalogue.bundles).map((entry) => <label className={styles.selectionRow} key={entry.id}><input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)} /><span><strong>{entry.name}{editor.kind === "package" && <span className={`${styles.pill} ${styles.bundle}`}>Bundle</span>}</strong><small>{"type" in entry ? entry.description : `${entry.itemIds.length} service / action: ${entry.itemIds.map((id) => catalogue.items.find((item) => item.id === id)?.name).join(", ")}`}</small></span></label>)}</div>
      {editor.kind === "package" && <><label className={styles.formField}><span>Lookup individual services &amp; actions</span><input className={styles.input} type="search" placeholder="Cari individual item..." value={itemLookup} onChange={(event) => setItemLookup(event.target.value)} /></label><div className={styles.selectionList}>{catalogue.items.filter((entry) => `${entry.name} ${entry.description}`.toLocaleLowerCase("id-ID").includes(itemLookup.toLocaleLowerCase("id-ID"))).map((entry) => <label className={styles.selectionRow} key={entry.id}><input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)} /><span><strong>{entry.name}<span className={`${styles.pill} ${entry.type === "Service" ? styles.service : styles.action}`}>{entry.type}</span></strong><small>{entry.description}</small></span></label>)}</div></>}
      <div className={styles.selectionSummary} aria-live="polite">{editor.kind === "bundle" ? <><strong>{selected.length} item(s) selected</strong><div className={styles.miniChips}>{selectedItems.map((entry) => <span className={`${styles.pill} ${entry.type === "Service" ? styles.service : styles.action}`} key={entry.id}>{entry.name}</span>)}</div></> : <><div className={styles.previewHeader}><strong>Package composition preview</strong><span className={styles.tiny}>{selected.length} lookup(s)</span></div><div>{selectedItems.length} unique service(s) / action(s)</div><div className={styles.miniChips}>{selectedItems.map((entry) => <span className={`${styles.pill} ${entry.type === "Service" ? styles.service : styles.action}`} key={entry.id}>{entry.name}</span>)}</div></>}</div>
      {editor.kind === "bundle" && <div className={styles.fieldHelp}>Bundle terdiri dari minimal satu item. Bundle tidak boleh memuat bundle lain agar struktur tidak berulang.</div>}
    </>}
    {editor.kind === "item" && <div className={styles.fieldHelp}>Item dapat dipilih langsung dalam Master Package, atau digabungkan ke satu maupun lebih Bundle.</div>}
    {editor.kind === "package" && <label className={styles.checklabel}><input type="checkbox" defaultChecked={pkg?.active ?? true} />Paket aktif dan bisa dipilih oleh customer</label>}
    <div className={styles.fieldHelp}>Non-authoritative fixture — no session, persistence, or official transition.</div>
  </div><div className={styles.modalFooter}><button className={styles.btn} onClick={onClose} type="button">Cancel</button><button className={`${styles.btn} ${styles.primary}`} type="submit"><Icon name="check" />{editor.kind === "item" ? "Save item" : editor.kind === "bundle" ? "Save bundle" : "Save package"}</button></div></form>;
}
