"use client";

import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import type { CustomerAuthReadModel } from "@/shared/scenarios/contracts";
import Image from "next/image";
import Link from "next/link";
import styles from "./customer-auth.module.css";
import { useState } from "react";

const assetRoot = "/reference-assets/ui-reference";

export function CustomerAuth({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  if (scenario.readModel.surface !== "customer-auth") return null;
  return <AuthFixture scenarioId={scenarioId} model={scenario.readModel} state={scenario.state} provenance={scenario.provenance.label} />;
}

function AuthFixture({ scenarioId, model, state, provenance }: Readonly<{ scenarioId: string; model: CustomerAuthReadModel; state: ReturnType<typeof getScenario>["state"]; provenance: string }>) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const isRegister = model.mode === "register";
  const logo = isRegister ? "daftar-image-01-5cfb309f414c.webp" : "masuk-image-01-5cfb309f414c.webp";
  const flower = isRegister ? "daftar-inline-svg-01-7499bdf895f0.svg" : "masuk-inline-svg-01-7499bdf895f0.svg";
  const eyebrow = isRegister ? "YOUR BRIDAL JOURNEY" : "WELCOME BACK";
  const heading = isRegister ? <>The beginning of <em>something beautiful.</em></> : <>A little care for <em>your big day.</em></>;
  const editorial = isRegister ? "Kenali layanan, rencanakan kebutuhan, dan siapkan momen istimewamu bersama pendamping personal pengantin." : "Seluruh detail untuk hari istimewamu layak mendapatkan perhatian. Selamat datang kembali di Ranur Bridal Care.";
  const isDefaultReferenceState = scenarioId.endsWith("-default");

  return <div className={`${styles.page} ${isRegister ? styles.register : styles.login}`} data-scenario-id={scenarioId} data-scenario-version="m1-fixture-v1">
    <a className={styles.skip} href="#auth-form-title">Langsung ke formulir</a>
    <main className={styles.shell}>
      <section aria-label="Pengenalan Ranur Bridal Care" className={styles.editorial}>
        <a aria-label="Ranur Bridal Care — kembali ke website" className={styles.brand} href="#auth-form-title">
          <Image alt="" aria-hidden="true" height={54} src={`${assetRoot}/${logo}`} width={53} />
          <span><strong>RANUR</strong><small>BRIDAL CARE</small></span>
        </a>
        <div className={styles.editorialBody}><div className={styles.eyebrow}>{eyebrow}</div><h1>{heading}</h1><p>{editorial}</p></div>
        <Image alt="" aria-hidden="true" className={styles.flower} height={560} src={`${assetRoot}/${flower}`} width={540} />
        <div className={styles.editorialFooter}>Your moment, our heart. ✧</div>
      </section>
      <section aria-labelledby="auth-form-title" className={styles.formSide}>
        <div className={styles.topnav}><a className={styles.backLink} href="#auth-form-title">←&nbsp; Kembali ke website</a></div>
        <div className={styles.formWrap}>
          <div className={styles.smallTop}>RANUR BRIDAL CARE · CUSTOMER ACCESS</div>
          <h2 id="auth-form-title">{model.title}</h2><p className={styles.subtitle}>{model.description}</p>
          <form className={styles.form} aria-label={`${model.title} fixture`} onSubmit={(event) => event.preventDefault()}>
            {isRegister && <><Field label="Nama lengkap" placeholder="Nama sesuai identitas" type="text" invalid={state.kind === "error"} /><Field label="Nomor WhatsApp" placeholder="Contoh: 0812 3456 7890" type="tel" invalid={state.kind === "error"} /></>}
            <Field label={isRegister ? "Email" : "Alamat email"} placeholder="nama@email.com" type="email" invalid={state.kind === "error"} />
            <div className={styles.field}><label htmlFor={`${scenarioId}-password`}>Kata sandi</label><div className={styles.passwordWrap}><input id={`${scenarioId}-password`} placeholder={isRegister ? "Minimal 8 karakter" : "Masukkan kata sandimu"} readOnly type={passwordVisible ? "text" : "password"} /><button aria-label={passwordVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={passwordVisible} className={styles.showPassword} onClick={() => setPasswordVisible(!passwordVisible)} type="button">{passwordVisible ? "Sembunyikan" : "Lihat"}</button></div>{isRegister && <span className={styles.fieldHint}>Gunakan minimal 8 karakter.</span>}</div>
            {isRegister && <Field label="Konfirmasi kata sandi" placeholder="Ketik ulang kata sandi" type="password" invalid={state.kind === "error"} />}
            {!isRegister && <div className={styles.inlineRow}><span>Akses khusus customer Ranur.</span><button className={styles.quietLink} onClick={() => setForgotOpen(true)} type="button">Lupa kata sandi?</button></div>}
            <button className={styles.submit} disabled={state.kind === "loading"} type="submit">{state.kind === "loading" ? "Menyiapkan fixture…" : isRegister ? "Daftar Akun →" : "Masuk Akun →"}</button>
            {!isDefaultReferenceState && <div aria-live="polite" className={`${styles.feedback} ${styles.show}`} role={state.kind === "error" ? "alert" : "status"}><strong>{state.kind === "success" ? "Hasil fixture" : `${state.kind} fixture state`}</strong>{model.feedback || state.message}</div>}
          </form>
          <div className={styles.divider} />
          <p className={styles.switchLine}>{isRegister ? <>Sudah punya akun? <Link href="/masuk">Masuk sekarang</Link></> : <>Belum punya akun? <Link href="/daftar">Daftar sekarang</Link></>}</p>
        </div>
        {!isDefaultReferenceState && <p className={styles.demoNote}>{provenance} Scenario: {scenarioId}.</p>}
      </section>
    </main>
    {forgotOpen && <div className={styles.backdrop} onClick={() => setForgotOpen(false)}><section aria-modal="true" aria-labelledby="forgot-title" className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog"><h3 id="forgot-title">Lupa kata sandi?</h3><p>Pemulihan kata sandi belum tersedia dalam fixture ini. Tidak ada akun atau sesi yang dapat dipulihkan.</p><button className={styles.submit} onClick={() => setForgotOpen(false)} type="button">Mengerti</button></section></div>}
  </div>;
}

function Field({ label, placeholder, type, invalid }: Readonly<{ label: string; placeholder: string; type: string; invalid: boolean }>) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div className={styles.field}><label htmlFor={id}>{label}</label><input aria-invalid={invalid || undefined} id={id} placeholder={placeholder} readOnly type={type} /></div>;
}
