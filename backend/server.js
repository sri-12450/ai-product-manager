import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import PDFDocument from "pdfkit";
import { interpretName, generateIngredientInfo } from "./openai.js";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// File path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "data", "ingredients.json");

// Load ingredients
let ingredients = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// Fuse.js setup
let fuse = new Fuse(ingredients, {
  keys: ["name"],
  threshold: 0.4,
  ignoreLocation: true,
});

// -----------------------------------------------------
// 🔍 SEARCH INGREDIENT
// -----------------------------------------------------
app.post("/api/search", async (req, res) => {
  try {
    const text = req.body.text.trim().toLowerCase();

    ingredients = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    fuse.setCollection(ingredients);

    // 1️⃣ Exact match
    const exact = ingredients.find(i => i.name.toLowerCase() === text);
    if (exact) {
      return res.json({
        interpreted: text,
        suggestions: [exact],
      });
    }

    // 2️⃣ AI normalized name
    const interpreted = await interpretName(text);
    const interpretedLower = interpreted.toLowerCase();

    // 3️⃣ Fuzzy search
    const results = fuse.search(interpretedLower).slice(0, 3).map(r => r.item);

    if (results.length > 0) {
      return res.json({
        interpreted,
        suggestions: results,
      });
    }

    // 4️⃣ AI generated ingredient
    const aiData = await generateIngredientInfo(interpreted);

    return res.json({
      interpreted,
      suggestions: [{ ...aiData, aiGenerated: true }],
      aiGenerated: true,
    });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// -----------------------------------------------------
// ➕ ADD INGREDIENT
// -----------------------------------------------------
app.post("/api/add", (req, res) => {
  try {
    const { name, image, description } = req.body;

    if (!name || !image || !description) {
      return res.status(400).json({ error: "Missing fields" });
    }

    ingredients = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    // Prevent duplicates
    if (ingredients.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      return res.json({ success: true, message: "Already exists" });
    }

    const newItem = { name, image, description };
    ingredients.push(newItem);

    fs.writeFileSync(dataPath, JSON.stringify(ingredients, null, 2));

    fuse.setCollection(ingredients);

    res.json({
      success: true,
      message: "Ingredient added successfully!",
      ingredient: newItem,
    });

  } catch (err) {
    console.error("Add error:", err);
    res.status(500).json({ error: "Cannot add ingredient" });
  }
});

// -----------------------------------------------------
// ❌ DELETE INGREDIENT
// -----------------------------------------------------
app.post("/api/delete", (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name missing" });
    }

    ingredients = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const index = ingredients.findIndex(
      i => i.name.toLowerCase() === name.toLowerCase()
    );

    if (index === -1) {
      return res.json({ success: false, message: "Ingredient not found" });
    }

    // Delete item
    ingredients.splice(index, 1);

    fs.writeFileSync(dataPath, JSON.stringify(ingredients, null, 2));

    fuse.setCollection(ingredients);

    return res.json({ success: true, message: "Deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// -----------------------------------------------------
// 📄 DOWNLOAD SEARCH RESULT AS PDF
// -----------------------------------------------------
app.post("/api/download-pdf", (req, res) => {
  try {
    const { interpreted, suggestions } = req.body;

    const doc = new PDFDocument();

    // Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=ingredient.pdf");

    doc.pipe(res);

    // Title
    doc.fontSize(22).text("Ingredient Search Result", { underline: true });
    doc.moveDown();

    // Search text
    doc.fontSize(16).text(`You searched for: ${interpreted}`);
    doc.moveDown();

    // Ingredient details
    suggestions.forEach((item, i) => {
      doc.fontSize(18).text(`${i + 1}. ${item.name}`);
      doc.moveDown(0.5);
      doc.fontSize(12).text(item.description);
      doc.moveDown(1.5);
    });

    doc.end();

  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ success: false, message: "PDF generation failed" });
  }
});

// -----------------------------------------------------
// 🚀 START SERVER
// -----------------------------------------------------
// -----------------------------------------------------
// 🚀 START SERVER (Render Compatible)
// -----------------------------------------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

