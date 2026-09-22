import { useEffect, useRef, useState } from "react";

// Photo-assisted food entry: the user snaps or uploads a photo of their food,
// then confirms what it is by name. The photo is a visual memory aid — it is
// NOT sent anywhere and no AI recognition runs. Once the user types the food
// name and submits, the parent searches the free Open Food Facts database.
//
// Calls onConfirm(name) with the food name the user entered.
export default function PhotoFoodEntry({ onConfirm, onClose }) {
  const fileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  // Revoke the object URL when the photo changes or the component unmounts,
  // so we don't leak blob memory.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image. Please choose a photo.");
      return;
    }
    setError(null);
    // Replace any previous photo (and free its URL).
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function submit(e) {
    e?.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Type at least 2 characters so we can find the food.");
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <div className="photo-entry">
      {/* Hidden native input. `capture` hints mobile browsers to open the
          camera, but the user can still pick an existing photo. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {imageUrl ? (
        <div className="photo-preview-wrap">
          <img src={imageUrl} alt="Your food" className="photo-preview" />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            Retake / choose another
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="photo-drop"
          onClick={() => fileRef.current?.click()}
        >
          <span className="photo-drop-icon">🖼️</span>
          <span>Take or choose a photo of your food</span>
        </button>
      )}

      <form onSubmit={submit} className="photo-confirm">
        <label className="qty-label">
          What food is this?
          <input
            type="text"
            className="search-input"
            placeholder="e.g. grilled chicken, apple, pasta…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <p className="muted photo-hint">
          Your photo stays on your device — just tell us what it is and we'll
          look up the nutrition.
        </p>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary full">
          Find this food →
        </button>
      </form>

      <button type="button" className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
