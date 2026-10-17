"use client";

import { useRef, useState } from "react";

// Where submissions go. Until NEXT_PUBLIC_FORM_ENDPOINT is set (a Google Apps Script,
// Formspree, or your own API that accepts a JSON POST), the form only shows the thank-you.
const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

const SPECIALITIES = ["MD Medicine", "Diabetologist", "DM Endocrinology", "Other"];
const PRACTICES = ["My own clinic", "Hospital or chain", "More than one centre", "Returning or starting fresh"];

export function ContactForm() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setState("sending");
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, source: "care-that-continues" }),
        });
        if (!res.ok) throw new Error(String(res.status));
      }
      setState("done");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <button className="btn btn--primary" type="button" onClick={() => dialog.current?.showModal()}>
        Start a conversation
      </button>
      <dialog
        ref={dialog}
        className="dialog"
        aria-labelledby="dlg-title"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="dialog__inner">
          <button className="dialog__close" type="button" aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {state === "done" ? (
            <p className="dialog__thanks" role="status">
              Thank you. Someone from our founding team will call you personally.
            </p>
          ) : (
            <form className="form" onSubmit={submit} noValidate>
              <h2 id="dlg-title" className="form__title">Start a conversation</h2>
              <label className="field">
                <span>Full name</span>
                <input name="name" autoComplete="name" required />
              </label>
              <fieldset className="field field--choices">
                <legend>Speciality</legend>
                {SPECIALITIES.map((s) => (
                  <label key={s} className="choice">
                    <input type="radio" name="speciality" value={s} required />
                    <span>{s}</span>
                  </label>
                ))}
              </fieldset>
              <label className="field">
                <span>City</span>
                <input name="city" autoComplete="address-level2" required />
              </label>
              <fieldset className="field field--choices">
                <legend>Current practice</legend>
                {PRACTICES.map((s) => (
                  <label key={s} className="choice">
                    <input type="radio" name="practice" value={s} required />
                    <span>{s}</span>
                  </label>
                ))}
              </fieldset>
              <label className="field">
                <span>Mobile number</span>
                <input
                  name="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$"
                  required
                />
              </label>
              <label className="field">
                <span>Email (optional)</span>
                <input name="email" type="email" autoComplete="email" />
              </label>
              <button className="btn btn--primary btn--block" type="submit" disabled={state === "sending"}>
                Request a conversation
              </button>
              {state === "error" && (
                <p className="form__error" role="alert">
                  That did not go through. Please try again, or speak to the founding team.
                </p>
              )}
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
