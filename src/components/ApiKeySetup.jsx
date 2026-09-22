import { useState } from "react";
import { getApiKey, setApiKey } from "../api/gemini";

// Lets the user paste their Google Gemini API key. The key is stored ONLY in
// this browser (localStorage) — never sent anywhere except Google's API when
// parsing a meal.
export default function ApiKeySetup({ onSaved, onClose }) {
  const [key, setKey] = useState(getApiKey());

  function save() {
    setApiKey(key.trim());
    onSaved();
  }

  return (
    <div className="key-setup">
      <div className="section-title">Connect Google Gemini (free)</div>
      <p className="muted">
        The "describe a meal" feature uses Google Gemini to estimate nutrition.
        It has a free tier that covers normal personal use.
      </p>
      <ol className="key-steps">
        <li>
          Open{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
          >
            Google AI Studio
          </a>{" "}
          and sign in.
        </li>
        <li>Click <strong>Create API key</strong> and copy it.</li>
        <li>Paste it below.</li>
      </ol>
      <label className="qty-label">
        Gemini API key
        <input
          type="password"
          className="search-input"
          placeholder="AIza…"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
      </label>
      <p className="muted photo-hint">
        Stored only in this browser. It is never saved in the app's code or
        shared with anyone.
      </p>
      <button
        className="btn btn-primary full"
        onClick={save}
        disabled={key.trim().length < 10}
      >
        Save key
      </button>
      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
