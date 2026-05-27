import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const DEFAULT_MATERIALS = [
  { id: "pla-silk-overture", name: "PLA Silk Overture", rollCost: 16, rollWeight: 1000 },
  { id: "pla-basic", name: "PLA Basic", rollCost: 16, rollWeight: 1000 },
  { id: "petg-rapid-elegoo", name: "PETG Rapid Elegoo", rollCost: 16, rollWeight: 1000 },
  { id: "tpu-95a", name: "TPU 95A", rollCost: 22, rollWeight: 1000 }
];

const DEFAULT_FORM = {
  productName: "Mini Copa Mundial 10 cm",
  modelGrams: 24,
  purgeGrams: 6,
  printHours: 2,
  printMinutes: 30,
  machineRate: 1.5,
  laborMinutes: 10,
  laborRate: 18,
  failureRate: 10,
  packagingCost: 0.5,
  hardwareCost: 0,
  amsEnabled: true,
  amsExtra: 1.5,
  minimumMargin: 2,
  recommendedMargin: 2.5,
  premiumMargin: 3,
  wholesale5Discount: 12,
  wholesale10Discount: 22,
  wholesale20Discount: 32
};

const DEFAULT_EXTRAS = [
  { id: "keyring", name: "Argolla llavero", quantity: 1, unitCost: 0.12 },
  { id: "bag", name: "Bolsa empaque", quantity: 1, unitCost: 0.10 }
];

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

function roundToQuarter(value) {
  return Math.ceil(value * 4) / 4;
}

function loadStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [tab, setTab] = useState("calculator");
  const [materials, setMaterials] = useState(() => loadStorage("materials", DEFAULT_MATERIALS));
  const [quotes, setQuotes] = useState(() => loadStorage("quotes", []));
  const [extraMaterials, setExtraMaterials] = useState(() => loadStorage("extraMaterials", DEFAULT_EXTRAS));
  const [form, setForm] = useState(() => loadStorage("form", DEFAULT_FORM));
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => loadStorage("selectedMaterialId", DEFAULT_MATERIALS[0].id));

  useEffect(() => localStorage.setItem("materials", JSON.stringify(materials)), [materials]);
  useEffect(() => localStorage.setItem("quotes", JSON.stringify(quotes)), [quotes]);
  useEffect(() => localStorage.setItem("extraMaterials", JSON.stringify(extraMaterials)), [extraMaterials]);
  useEffect(() => localStorage.setItem("form", JSON.stringify(form)), [form]);
  useEffect(() => localStorage.setItem("selectedMaterialId", JSON.stringify(selectedMaterialId)), [selectedMaterialId]);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const result = useMemo(() => {
    const modelGrams = numberValue(form.modelGrams);
    const purgeGrams = numberValue(form.purgeGrams);
    const totalGrams = modelGrams + purgeGrams;

    const rollCost = numberValue(selectedMaterial?.rollCost, 16);
    const rollWeight = numberValue(selectedMaterial?.rollWeight, 1000);
    const materialCost = (totalGrams / rollWeight) * rollCost;

    const hours = numberValue(form.printHours) + numberValue(form.printMinutes) / 60;
    const machineCost = hours * numberValue(form.machineRate, 1.5);
    const laborCost = (numberValue(form.laborMinutes) / 60) * numberValue(form.laborRate, 18);
    const amsCost = form.amsEnabled ? numberValue(form.amsExtra) : 0;

    const extraMaterialsCost = extraMaterials.reduce((sum, item) => {
      return sum + numberValue(item.quantity) * numberValue(item.unitCost);
    }, 0);

    const baseCost =
      materialCost +
      machineCost +
      laborCost +
      amsCost +
      extraMaterialsCost +
      numberValue(form.packagingCost) +
      numberValue(form.hardwareCost);

    const failureCost = baseCost * (numberValue(form.failureRate) / 100);
    const realCost = baseCost + failureCost;

    const minimumPrice = roundToQuarter(realCost * numberValue(form.minimumMargin, 2));
    const recommendedPrice = roundToQuarter(realCost * numberValue(form.recommendedMargin, 2.5));
    const premiumPrice = roundToQuarter(realCost * numberValue(form.premiumMargin, 3));

    return {
      totalGrams,
      materialCost,
      machineCost,
      laborCost,
      amsCost,
      extraMaterialsCost,
      failureCost,
      realCost,
      minimumPrice,
      recommendedPrice,
      premiumPrice,
      wholesale5: roundToQuarter(recommendedPrice * (1 - numberValue(form.wholesale5Discount) / 100)),
      wholesale10: roundToQuarter(recommendedPrice * (1 - numberValue(form.wholesale10Discount) / 100)),
      wholesale20: roundToQuarter(recommendedPrice * (1 - numberValue(form.wholesale20Discount) / 100)),
      profitRecommended: recommendedPrice - realCost,
      marginRecommended: recommendedPrice > 0 ? ((recommendedPrice - realCost) / recommendedPrice) * 100 : 0
    };
  }, [form, selectedMaterial, extraMaterials]);

  const addExtraMaterial = () => {
    setExtraMaterials((current) => [
      ...current,
      { id: crypto.randomUUID(), name: "Material extra", quantity: 1, unitCost: 0 }
    ]);
  };

  const updateExtraMaterial = (id, key, value) => {
    setExtraMaterials((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const removeExtraMaterial = (id) => {
    setExtraMaterials((current) => current.filter((item) => item.id !== id));
  };

  const updateMaterial = (id, key, value) => {
    setMaterials((current) => current.map((material) => (material.id === id ? { ...material, [key]: value } : material)));
  };

  const addMaterial = () => {
    const id = crypto.randomUUID();
    setMaterials((current) => [
      ...current,
      { id, name: "Nuevo material", rollCost: 20, rollWeight: 1000 }
    ]);
    setSelectedMaterialId(id);
  };

  const removeMaterial = (id) => {
    if (materials.length <= 1) return;
    setMaterials((current) => current.filter((m) => m.id !== id));
    if (selectedMaterialId === id) setSelectedMaterialId(materials[0].id);
  };

  const saveQuote = () => {
    const quote = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      productName: form.productName || "Producto sin nombre",
      material: selectedMaterial?.name || "Material",
      realCost: result.realCost,
      recommendedPrice: result.recommendedPrice,
      premiumPrice: result.premiumPrice,
      grams: result.totalGrams
    };
    setQuotes((current) => [quote, ...current]);
  };

  const removeQuote = (id) => setQuotes((current) => current.filter((quote) => quote.id !== id));

  const resetAll = () => {
    if (!confirm("¿Seguro que quieres borrar historial y restaurar valores?")) return;
    setMaterials(DEFAULT_MATERIALS);
    setQuotes([]);
    setExtraMaterials(DEFAULT_EXTRAS);
    setForm(DEFAULT_FORM);
    setSelectedMaterialId(DEFAULT_MATERIALS[0].id);
  };

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">MVP v1</p>
          <h1>Calculadora de Precios 3D</h1>
          <p>Cotiza piezas impresas considerando material, máquina, AMS, postproceso, fallos y margen real.</p>
        </div>
        <button className="ghost" onClick={resetAll}>Restaurar</button>
      </header>

      <nav className="tabs">
        <button className={tab === "calculator" ? "active" : ""} onClick={() => setTab("calculator")}>Calculadora</button>
        <button className={tab === "materials" ? "active" : ""} onClick={() => setTab("materials")}>Materiales</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>Historial</button>
      </nav>

      {tab === "calculator" && (
        <section className="layout">
          <div className="left">
            <Card title="Datos de la pieza">
              <Field label="Nombre de la pieza">
                <input value={form.productName} onChange={(e) => update("productName", e.target.value)} />
              </Field>

              <div className="grid2">
                <Field label="Material">
                  <select value={selectedMaterialId} onChange={(e) => setSelectedMaterialId(e.target.value)}>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>{material.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Costo del rollo">
                  <input type="number" step="0.01" value={selectedMaterial?.rollCost || 0} onChange={(e) => updateMaterial(selectedMaterial.id, "rollCost", e.target.value)} />
                </Field>

                <Field label="Gramos del modelo">
                  <input type="number" value={form.modelGrams} onChange={(e) => update("modelGrams", e.target.value)} />
                </Field>

                <Field label="Gramos de purga / torre / desperdicio">
                  <input type="number" value={form.purgeGrams} onChange={(e) => update("purgeGrams", e.target.value)} />
                </Field>
              </div>
            </Card>

            <Card title="Tiempo y producción">
              <div className="grid2">
                <Field label="Horas de impresión">
                  <input type="number" value={form.printHours} onChange={(e) => update("printHours", e.target.value)} />
                </Field>
                <Field label="Minutos de impresión">
                  <input type="number" value={form.printMinutes} onChange={(e) => update("printMinutes", e.target.value)} />
                </Field>
                <Field label="Costo máquina por hora">
                  <input type="number" step="0.25" value={form.machineRate} onChange={(e) => update("machineRate", e.target.value)} />
                </Field>
                <Field label="Riesgo de fallo (%)">
                  <input type="number" value={form.failureRate} onChange={(e) => update("failureRate", e.target.value)} />
                </Field>
                <Field label="Minutos de limpieza/postproceso">
                  <input type="number" value={form.laborMinutes} onChange={(e) => update("laborMinutes", e.target.value)} />
                </Field>
                <Field label="Tarifa mano de obra por hora">
                  <input type="number" value={form.laborRate} onChange={(e) => update("laborRate", e.target.value)} />
                </Field>
                <Field label="Empaque general">
                  <input type="number" step="0.01" value={form.packagingCost} onChange={(e) => update("packagingCost", e.target.value)} />
                </Field>
                <Field label="Extra manual rápido">
                  <input type="number" step="0.01" value={form.hardwareCost} onChange={(e) => update("hardwareCost", e.target.value)} />
                </Field>
              </div>

              <div className="switch-row">
                <div>
                  <strong>AMS / Multicolor</strong>
                  <p>Agrega costo por purga, cambios y manejo extra.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={form.amsEnabled} onChange={(e) => update("amsEnabled", e.target.checked)} />
                  <span></span>
                </label>
              </div>

              {form.amsEnabled && (
                <Field label="Extra AMS / multicolor">
                  <input type="number" step="0.25" value={form.amsExtra} onChange={(e) => update("amsExtra", e.target.value)} />
                </Field>
              )}
            </Card>

            <Card title="Materiales extra">
              <p className="muted">Argollas, imanes, tornillos, bolsas, stickers, LEDs, pegamento o cualquier extra por pieza.</p>
              <div className="extras">
                {extraMaterials.map((item) => (
                  <div className="extra-row" key={item.id}>
                    <Field label="Material">
                      <input value={item.name} onChange={(e) => updateExtraMaterial(item.id, "name", e.target.value)} />
                    </Field>
                    <Field label="Cantidad">
                      <input type="number" step="1" value={item.quantity} onChange={(e) => updateExtraMaterial(item.id, "quantity", e.target.value)} />
                    </Field>
                    <Field label="Costo unitario">
                      <input type="number" step="0.01" value={item.unitCost} onChange={(e) => updateExtraMaterial(item.id, "unitCost", e.target.value)} />
                    </Field>
                    <button className="danger" onClick={() => removeExtraMaterial(item.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
              <div className="total-line">
                <span>Total materiales extra</span>
                <strong>{money(result.extraMaterialsCost)}</strong>
              </div>
              <button className="secondary" onClick={addExtraMaterial}>Agregar material extra</button>
            </Card>
          </div>

          <aside className="right">
            <Card title="Resultado" dark>
              <div className="summary-grid">
                <Mini label="Material" value={money(result.materialCost)} />
                <Mini label="Máquina" value={money(result.machineCost)} />
                <Mini label="Postproceso" value={money(result.laborCost)} />
                <Mini label="Extras" value={money(result.extraMaterialsCost)} />
                <Mini label="AMS" value={money(result.amsCost)} />
                <Mini label="Fallo" value={money(result.failureCost)} />
              </div>

              <div className="big-number">
                <span>Costo real estimado</span>
                <strong>{money(result.realCost)}</strong>
              </div>

              <PriceRow label="Precio mínimo" value={money(result.minimumPrice)} />
              <PriceRow label="Precio recomendado" value={money(result.recommendedPrice)} highlight />
              <PriceRow label="Precio premium" value={money(result.premiumPrice)} />

              <div className="note">
                <p>Ganancia recomendada: <strong>{money(result.profitRecommended)}</strong></p>
                <p>Margen aprox.: <strong>{result.marginRecommended.toFixed(1)}%</strong></p>
              </div>

              <button className="primary" onClick={saveQuote}>Guardar cotización</button>
            </Card>

            <Card title="Mayoreo sugerido">
              <PriceRow label="5 piezas" value={`${money(result.wholesale5)} c/u`} />
              <PriceRow label="10 piezas" value={`${money(result.wholesale10)} c/u`} />
              <PriceRow label="20 piezas" value={`${money(result.wholesale20)} c/u`} />
            </Card>
          </aside>
        </section>
      )}

      {tab === "materials" && (
        <section className="single">
          <Card title="Materiales guardados">
            <button className="secondary" onClick={addMaterial}>Agregar material</button>
            <div className="material-list">
              {materials.map((material) => (
                <div className="material-card" key={material.id}>
                  <Field label="Nombre">
                    <input value={material.name} onChange={(e) => updateMaterial(material.id, "name", e.target.value)} />
                  </Field>
                  <Field label="Costo del rollo">
                    <input type="number" step="0.01" value={material.rollCost} onChange={(e) => updateMaterial(material.id, "rollCost", e.target.value)} />
                  </Field>
                  <Field label="Peso del rollo (g)">
                    <input type="number" value={material.rollWeight} onChange={(e) => updateMaterial(material.id, "rollWeight", e.target.value)} />
                  </Field>
                  <p>Costo por gramo: <strong>{money(numberValue(material.rollCost) / numberValue(material.rollWeight, 1000))}</strong></p>
                  <button className="danger" onClick={() => removeMaterial(material.id)}>Eliminar</button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {tab === "history" && (
        <section className="single">
          <Card title="Historial de cotizaciones">
            {quotes.length === 0 ? (
              <p className="empty">Aún no has guardado cotizaciones.</p>
            ) : (
              <div className="quote-list">
                {quotes.map((quote) => (
                  <div className="quote" key={quote.id}>
                    <div>
                      <strong>{quote.productName}</strong>
                      <p>{quote.date} · {quote.material} · {quote.grams.toFixed(1)} g</p>
                    </div>
                    <div className="quote-price">
                      <span>Recomendado</span>
                      <strong>{money(quote.recommendedPrice)}</strong>
                    </div>
                    <button className="danger" onClick={() => removeQuote(quote.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}
    </main>
  );
}

function Card({ title, children, dark = false }) {
  return (
    <div className={`card ${dark ? "dark" : ""}`}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Mini({ label, value }) {
  return (
    <div className="mini">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PriceRow({ label, value, highlight = false }) {
  return (
    <div className={`price-row ${highlight ? "highlight" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
