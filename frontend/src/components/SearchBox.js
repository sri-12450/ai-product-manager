import { useState } from "react";
import axios from "axios";
import "../styles/main.css";

export default function SearchBox() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [ingName, setIngName] = useState("");
  const [ingImage, setIngImage] = useState("");
  const [ingDesc, setIngDesc] = useState("");
  const [msg, setMsg] = useState("");

  // ---------------------------------
  // SEARCH INGREDIENT
  // ---------------------------------
  const handleSearch = async () => {
    if (!text.trim()) return;

    try {
      const res = await axios.post("http://localhost:4000/api/search", {
        text,
      });

      setResult(res.data);

      if (res.data.suggestions?.length > 0) {
        const s = res.data.suggestions[0];
        setIngName(s.name);
        setIngImage(s.image);
        setIngDesc(s.description);
      }
    } catch (err) {
      console.error(err);
      alert("Search failed");
    }
  };

  // ---------------------------------
  // ADD NEW INGREDIENT
  // ---------------------------------
  const handleAddIngredient = async () => {
    try {
      const res = await axios.post("http://localhost:4000/api/add", {
        name: ingName,
        image: ingImage,
        description: ingDesc,
      });

      if (res.data.success) {
        setMsg("Ingredient added!");
        setTimeout(() => {
          setShowModal(false);
          setMsg("");
        }, 1200);
      } else {
        setMsg("Failed to add ingredient");
      }
    } catch (err) {
      console.error(err);
      setMsg("Error adding ingredient");
    }
  };

  // ---------------------------------
  // DELETE INGREDIENT
  // ---------------------------------
  const handleDelete = async (name) => {
    if (!window.confirm(`Delete ingredient "${name}"?`)) return;

    try {
      const res = await axios.post("http://localhost:4000/api/delete", {
        name,
      });

      if (res.data.success) {
        alert("Deleted!");

        setResult((prev) => ({
          ...prev,
          suggestions: prev.suggestions.filter((x) => x.name !== name),
        }));
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting ingredient");
    }
  };

  // ---------------------------------
  // DOWNLOAD PDF
  // ---------------------------------
  const handleDownloadPDF = async () => {
    if (!result) return;

    const res = await axios.post(
      "http://localhost:4000/api/download-pdf",
      result,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ingredient.pdf";
    a.click();
  };

  return (
    <div className="search-box-wrapper">
      {/* Search Bar */}
      <div className="search-box">
        <input
          placeholder="Search ingredient..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>

        <button className="add-btn" onClick={() => setShowModal(true)}>
          + Add
        </button>
      </div>

      {/* SEARCH RESULT */}
      {result && (
        <div className="result-box">
          <p>
            <b>You meant:</b> {result.interpreted}
          </p>

          {result.suggestions.length === 0 ? (
            <p>No match found.</p>
          ) : (
            result.suggestions.map((item, i) => (
              <div key={i} className="item">
                <h3>{item.name}</h3>
                <img src={item.image} width="120" alt="" />

                <ul>
                  {item.description
                    .split("•")
                    .filter((line) => line.trim() !== "")
                    .map((line, i) => (
                      <li key={i}>{line.trim()}</li>
                    ))}
                </ul>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item.name)}
                >
                  Delete
                </button>
              </div>
            ))
          )}

          {/* PDF BUTTON HERE */}
          <button className="pdf-btn" onClick={handleDownloadPDF}>
            Download as PDF
          </button>
        </div>
      )}

      {/* ADD MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Add Ingredient</h2>

            <label>Name</label>
            <input
              value={ingName}
              onChange={(e) => setIngName(e.target.value)}
            />

            <label>Image URL</label>
            <input
              value={ingImage}
              onChange={(e) => setIngImage(e.target.value)}
            />

            <label>Description</label>
            <textarea
              value={ingDesc}
              onChange={(e) => setIngDesc(e.target.value)}
            ></textarea>

            <button className="add-submit" onClick={handleAddIngredient}>
              Add Ingredient
            </button>

            {msg && <p className="add-msg">{msg}</p>}

            <button className="close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
