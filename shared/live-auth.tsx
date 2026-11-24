"use client";

import { createAuthClient } from "better-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./customer-auth.module.css";

const client = createAuthClient();

export function LiveAuth({ mode }: { mode: "register" | "customer" | "admin" }) {
  const router = useRouter();
  const register = mode === "register";
  const admin = mode === "admin";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    setError("");
    if (register && password !== values.get("confirm")) {
      setError("Konfirmasi kata sandi belum cocok.");
      return;
    }
    setBusy(true);
    try {
      const result = register
        ? await client.signUp.email({ email, password, name: String(values.get("name") ?? "").trim() })
        : await client.signIn.email({ email, password });
      if (result.error) {
        setError(register ? "Akun belum dapat dibuat. Periksa data dan coba lagi." : "Email atau kata sandi tidak cocok.");
        return;
      }
      router.replace(admin ? "/admin" : "/beranda");
      router.refresh();
    } catch {
      setError("Permintaan belum berhasil. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return <div className={`${styles.page} ${register ? styles.register : styles.login}`}>
    <a className={styles.skip} href="#auth-form-title">Langsung ke formulir</a>
    <main className={styles.shell}>
      <section aria-label="Pengenalan Ranur Bridal Care" className={styles.editorial}>
        <Link aria-label="Ranur Bridal Care — kembali ke website" className={styles.brand} href="/">
          <Image alt="" aria-hidden="true" height={54} src={`/reference-assets/ui-reference/${register ? "daftar" : "masuk"}-image-01-5cfb309f414c.webp`} width={53} />
          <span><strong>RANUR</strong><small>BRIDAL CARE</small></span>
        </Link>
        <div className={styles.editorialBody}>
          <div className={styles.eyebrow}>{register ? "YOUR BRIDAL JOURNEY" : "WELCOME BACK"}</div>
          <h1>{register ? <>The beginning of <em>something beautiful.</em></> : <>A little care for <em>your big day.</em></>}</h1>
          <p>{register ? "Kenali layanan, rencanakan kebutuhan, dan siapkan momen istimewamu bersama pendamping personal pengantin." : "Seluruh detail untuk hari istimewamu layak mendapatkan perhatian. Selamat datang kembali di Ranur Bridal Care."}</p>
        </div>
        <div aria-hidden="true" className={styles.flower} />
        <div className={styles.editorialFooter}>Your moment, our heart. ✧</div>
      </section>
      <section aria-labelledby="auth-form-title" className={styles.formSide}>
        <div className={styles.topnav}><Link className={styles.backLink} href="/"><svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="m13 5-7 7 7 7M6 12h13" /></svg>Kembali ke website</Link></div>
        <div className={styles.formWrap}>
          <div className={styles.smallTop}>RANUR BRIDAL CARE · {admin ? "ADMIN ACCESS" : "CUSTOMER ACCESS"}</div>
          <h2 id="auth-form-title">{register ? "Daftar Akun" : admin ? "Masuk Admin" : "Masuk Akun"}</h2>
          <p className={styles.subtitle}>{register ? "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal." : admin ? "Akses khusus tim Ranur Bridal Care." : "Masukkan email dan kata sandimu untuk melanjutkan."}</p>
          <form aria-label={register ? "Daftar akun customer" : admin ? "Masuk admin" : "Masuk customer"} className={styles.form} onSubmit={submit}>
            {register && <div className={styles.field}><label htmlFor="auth-name">Nama lengkap</label><input autoComplete="name" id="auth-name" name="name" placeholder="Nama sesuai identitas" required type="text" /></div>}
            <div className={styles.field}><label htmlFor="auth-email">{register ? "Email" : "Alamat email"}</label><input autoComplete="email" id="auth-email" name="email" placeholder="nama@email.com" required type="email" /></div>
            <div className={styles.field}><label htmlFor="auth-password">Kata sandi</label><div className={styles.passwordWrap}><input autoComplete={register ? "new-password" : "current-password"} id="auth-password" minLength={register ? 8 : undefined} name="password" placeholder={register ? "Minimal 8 karakter" : "Masukkan kata sandimu"} required type={visible ? "text" : "password"} /><button aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={visible} className={styles.showPassword} onClick={() => setVisible(!visible)} type="button">{visible ? "Sembunyikan" : "Lihat"}</button></div>{register && <span className={styles.fieldHint}>Gunakan minimal 8 karakter.</span>}</div>
            {register && <div className={styles.field}><label htmlFor="auth-confirm">Konfirmasi kata sandi</label><div className={styles.passwordWrap}><input autoComplete="new-password" id="auth-confirm" name="confirm" placeholder="Ketik ulang kata sandi" required type={confirmationVisible ? "text" : "password"} /><button aria-label={confirmationVisible ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"} aria-pressed={confirmationVisible} className={styles.showPassword} onClick={() => setConfirmationVisible(!confirmationVisible)} type="button">{confirmationVisible ? "Sembunyikan" : "Lihat"}</button></div></div>}
            {!register && !admin && <div className={styles.inlineRow}><span>Akses khusus customer Ranur.</span></div>}
            <button className={styles.submit} disabled={busy} type="submit">{busy ? "Memproses…" : <>{register ? "Daftar Akun" : "Masuk Akun"}<svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M4 12h16m-7-7 7 7-7 7" /></svg></>}</button>
            {error && <div aria-live="polite" className={`${styles.feedback} ${styles.show}`} role="alert"><strong>Belum berhasil</strong>{error}</div>}
          </form>
          {!admin && <><div className={styles.divider} /><p className={styles.switchLine}>{register ? <>Sudah punya akun? <Link href="/masuk">Masuk di sini</Link></> : <>Belum punya akun? <Link href="/daftar">Daftar sekarang</Link></>}</p></>}
        </div>
      </section>
    </main>
  </div>;
}
