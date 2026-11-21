"use client";

import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import type { CustomerAuthReadModel } from "@/shared/scenarios/contracts";
import Image from "next/image";
import Link from "next/link";
import styles from "./customer-auth.module.css";
import { useRef, useState } from "react";

const assetRoot = "/reference-assets/ui-reference";

export function CustomerAuth({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  if (scenario.readModel.surface !== "customer-auth") return null;
  return <AuthFixture scenarioId={scenarioId} model={scenario.readModel} state={scenario.state} provenance={scenario.provenance.label} />;
}

function AuthFixture({ scenarioId, model, state, provenance }: Readonly<{ scenarioId: string; model: CustomerAuthReadModel; state: ReturnType<typeof getScenario>["state"]; provenance: string }>) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const forgotOpener = useRef<HTMLButtonElement>(null);
  const forgotClose = useRef<HTMLButtonElement>(null);
  const isRegister = model.mode === "register";
  const logo = isRegister ? "daftar-image-01-5cfb309f414c.webp" : "masuk-image-01-5cfb309f414c.webp";
  const eyebrow = isRegister ? "YOUR BRIDAL JOURNEY" : "WELCOME BACK";
  const heading = isRegister ? <>The beginning of <em>something beautiful.</em></> : <>A little care for <em>your big day.</em></>;
  const editorial = isRegister ? "Kenali layanan, rencanakan kebutuhan, dan siapkan momen istimewamu bersama pendamping personal pengantin." : "Seluruh detail untuk hari istimewamu layak mendapatkan perhatian. Selamat datang kembali di Ranur Bridal Care.";
  const isDefaultReferenceState = scenarioId.endsWith("-default");

  return <div className={`${styles.page} ${isRegister ? styles.register : styles.login}`} data-scenario-id={scenarioId} data-scenario-version="m1-fixture-v1">
    <a className={styles.skip} href="#auth-form-title">Langsung ke formulir</a>
    <main className={styles.shell}>
      <section aria-label="Pengenalan Ranur Bridal Care" className={styles.editorial}>
        <Link aria-label="Ranur Bridal Care — kembali ke website" className={styles.brand} href="/">
          <Image alt="" aria-hidden="true" height={54} src={`${assetRoot}/${logo}`} width={53} />
          <span><strong>RANUR</strong><small>BRIDAL CARE</small></span>
        </Link>
        <div className={styles.editorialBody}><div className={styles.eyebrow}>{eyebrow}</div><h1>{heading}</h1><p>{editorial}</p></div>
        <div aria-hidden="true" className={styles.flower} />
        <div className={styles.editorialFooter}>Your moment, our heart. ✧</div>
      </section>
      <section aria-labelledby="auth-form-title" className={styles.formSide}>
        <div className={styles.topnav}><Link className={styles.backLink} href="/"><BackArrow />Kembali ke website</Link></div>
        <div className={styles.formWrap}>
          <div className={styles.smallTop}>RANUR BRIDAL CARE · CUSTOMER ACCESS</div>
          <h2 id="auth-form-title">{model.title}</h2><p className={styles.subtitle}>{model.description}</p>
          <form className={styles.form} aria-label={`${model.title} fixture`} onSubmit={(event) => event.preventDefault()}>
            {isRegister && <><Field label="Nama lengkap" placeholder="Nama sesuai identitas" type="text" invalid={state.kind === "error"} /><Field label="Nomor WhatsApp" placeholder="Contoh: 0812 3456 7890" type="tel" invalid={state.kind === "error"} /></>}
            <Field label={isRegister ? "Email" : "Alamat email"} placeholder="nama@email.com" type="email" invalid={state.kind === "error"} />
            <PasswordField id={`${scenarioId}-password`} invalid={state.kind === "error"} label="Kata sandi" placeholder={isRegister ? "Minimal 8 karakter" : "Masukkan kata sandimu"} showHint={isRegister} visible={passwordVisible} onVisibilityChange={setPasswordVisible} />
            {isRegister && <PasswordField id={`${scenarioId}-confirmation`} invalid={state.kind === "error"} label="Konfirmasi kata sandi" placeholder="Ketik ulang kata sandi" visible={confirmationVisible} onVisibilityChange={setConfirmationVisible} />}
            {!isRegister && <div className={styles.inlineRow}><span>Akses khusus customer Ranur.</span><button className={styles.quietLink} onClick={() => { setForgotOpen(true); requestAnimationFrame(() => forgotClose.current?.focus()); }} ref={forgotOpener} type="button">Lupa kata sandi?</button></div>}
            <button className={styles.submit} disabled={state.kind === "loading"} type="submit">{state.kind === "loading" ? "Menyiapkan fixture…" : <>{isRegister ? "Daftar Akun" : "Masuk Akun"} <ForwardArrow /></>}</button>
            {!isDefaultReferenceState && <div aria-live="polite" className={`${styles.feedback} ${styles.show}`} role={state.kind === "error" ? "alert" : "status"}><strong>{state.kind === "success" ? "Hasil fixture" : `${state.kind} fixture state`}</strong>{model.feedback || state.message}</div>}
          </form>
          <div className={styles.divider} />
          <p className={styles.switchLine}>{isRegister ? <>Sudah punya akun? <Link href="/masuk">Masuk di sini</Link></> : <>Belum punya akun? <Link href="/daftar">Daftar sekarang</Link></>}</p>
        </div>
        {!isDefaultReferenceState && <p className={styles.demoNote}>{provenance} Scenario: {scenarioId}.</p>}
      </section>
    </main>
    {forgotOpen && <div className={styles.backdrop} onClick={() => { setForgotOpen(false); forgotOpener.current?.focus(); }} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setForgotOpen(false); forgotOpener.current?.focus(); } if (event.key === "Tab") { event.preventDefault(); forgotClose.current?.focus(); } }}><section aria-describedby="forgot-description" aria-modal="true" aria-labelledby="forgot-title" className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog"><h3 id="forgot-title">Lupa kata sandi?</h3><p id="forgot-description">Pemulihan kata sandi belum tersedia dalam fixture ini. Tidak ada akun atau sesi yang dapat dipulihkan.</p><button className={styles.submit} onClick={() => { setForgotOpen(false); forgotOpener.current?.focus(); }} ref={forgotClose} type="button">Mengerti</button></section></div>}
  </div>;
}

function Field({ label, placeholder, type, invalid }: Readonly<{ label: string; placeholder: string; type: string; invalid: boolean }>) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div className={styles.field}><label htmlFor={id}>{label}</label><input aria-invalid={invalid || undefined} id={id} placeholder={placeholder} readOnly type={type} /></div>;
}

function PasswordField({ id, invalid, label, placeholder, showHint = false, visible, onVisibilityChange }: Readonly<{ id: string; invalid: boolean; label: string; placeholder: string; showHint?: boolean; visible: boolean; onVisibilityChange: (visible: boolean) => void }>) {
  return <div className={styles.field}><label htmlFor={id}>{label}</label><div className={styles.passwordWrap}><input aria-invalid={invalid || undefined} id={id} placeholder={placeholder} readOnly type={visible ? "text" : "password"} /><button aria-label={visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`} aria-pressed={visible} className={styles.showPassword} onClick={() => onVisibilityChange(!visible)} type="button">{visible ? "Sembunyikan" : "Lihat"}</button></div>{showHint && <span className={styles.fieldHint}>Gunakan minimal 8 karakter.</span>}</div>;
}

function BackArrow() { return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="m13 5-7 7 7 7M6 12h13" /></svg>; }

function ForwardArrow() { return <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>; }
