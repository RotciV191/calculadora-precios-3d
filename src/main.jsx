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
  minimumMarginPercent: 40,
  recommendedMarginPercent: 60,
  premiumMarginPercent: 70,
  wholesale5Discount: 12,
  wholesale10Discount: 22,
  wholesale20Discount: 32
};

const DEFAULT_EXTRAS = [
  { id: "keyring", name: "Argolla llavero", quantity: 1, unitCost: 0.12, supplyId: "keyrings" },
  { id: "bag", name: "Bolsa empaque", quantity: 1, unitCost: 0.10, supplyId: "bags" }
];

const DEFAULT_SUPPLIES = [
  { id: "keyrings", name: "Argollas llavero", packageCost: 8.99, packageQuantity: 100 },
  { id: "magnets", name: "Imanes", packageCost: 12.99, packageQuantity: 200 },
  { id: "bags", name: "Bolsas empaque", packageCost: 6.99, packageQuantity: 100 },
  { id: "stickers", name: "Stickers", packageCost: 10, packageQuantity: 250 },
  { id: "screws", name: "Tornillos", packageCost: 7.99, packageQuantity: 100 },
  { id: "nuts", name: "Tuercas", packageCost: 6.99, packageQuantity: 100 },
  { id: "leds", name: "LEDs", packageCost: 9.99, packageQuantity: 50 },
  { id: "glue", name: "Pegamento", packageCost: 4.99, packageQuantity: 1 },
  { id: "chain", name: "Cadena", packageCost: 8.99, packageQuantity: 20 },
  { id: "premium-packaging", name: "Empaque premium", packageCost: 12.99, packageQuantity: 50 }
];

const ORDER_STATUSES = ["Cotizado", "Aceptado", "En producción", "Listo", "Entregado", "Pagado", "Cancelado", "Devolución"];
const SALE_TYPES = ["En persona", "WhatsApp", "Instagram", "Facebook", "Etsy", "TikTok", "Referido", "Otro"];
const PAYMENT_METHODS = ["No definido", "Cash", "Zelle", "Cash App", "Venmo", "Tarjeta", "Transferencia", "PayPal", "Otro"];
const PRIORITIES = ["Normal", "Alta", "Urgente"];

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function supplyUnitCost(supply) {
  return numberValue(supply.packageCost) / Math.max(1, numberValue(supply.packageQuantity, 1));
}

function priceFromMargin(cost, marginPercent) {
  const margin = Math.min(95, Math.max(0, numberValue(marginPercent))) / 100;
  if (margin >= 0.95) return cost;
  return cost / (1 - margin);
}

function App() {
  const [tab, setTab] = useState("dashboard");
  const [materials, setMaterials] = useState(() => loadStorage("materials", DEFAULT_MATERIALS));
  const [supplies, setSupplies] = useState(() => loadStorage("supplies", DEFAULT_SUPPLIES));
  const [quotes, setQuotes] = useState(() => loadStorage("quotes", []));
  const [products, setProducts] = useState(() => loadStorage("products", []));
  const [orders, setOrders] = useState(() => loadStorage("orders", []));
  const [extraMaterials, setExtraMaterials] = useState(() => loadStorage("extraMaterials", DEFAULT_EXTRAS));
  const [form, setForm] = useState(() => {
    const stored = loadStorage("form", DEFAULT_FORM);
    return {
      ...DEFAULT_FORM,
      ...stored,
      minimumMarginPercent: stored.minimumMarginPercent ?? 40,
      recommendedMarginPercent: stored.recommendedMarginPercent ?? 60,
      premiumMarginPercent: stored.premiumMarginPercent ?? 70
    };
  });
  const [selectedMaterialId, setSelectedMaterialId] = useState(() => loadStorage("selectedMaterialId", DEFAULT_MATERIALS[0].id));

  const [orderDraft, setOrderDraft] = useState(() => loadStorage("orderDraft", {
    customerName: "",
    contact: "",
    saleType: "En persona",
    status: "Cotizado",
    paymentMethod: "No definido",
    deposit: 0,
    promisedDate: "",
    priority: "Normal",
    notes: ""
  }));

  const [copiedOrderId, setCopiedOrderId] = useState("");
  const [printOrder, setPrintOrder] = useState(null);

  useEffect(() => localStorage.setItem("materials", JSON.stringify(materials)), [materials]);
  useEffect(() => localStorage.setItem("supplies", JSON.stringify(supplies)), [supplies]);
  useEffect(() => localStorage.setItem("quotes", JSON.stringify(quotes)), [quotes]);
  useEffect(() => localStorage.setItem("products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("orders", JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem("extraMaterials", JSON.stringify(extraMaterials)), [extraMaterials]);
  useEffect(() => localStorage.setItem("form", JSON.stringify(form)), [form]);
  useEffect(() => localStorage.setItem("selectedMaterialId", JSON.stringify(selectedMaterialId)), [selectedMaterialId]);
  useEffect(() => localStorage.setItem("orderDraft", JSON.stringify(orderDraft)), [orderDraft]);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateOrderDraft = (key, value) => setOrderDraft((current) => ({ ...current, [key]: value }));

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

    const minimumPrice = roundToQuarter(priceFromMargin(realCost, form.minimumMarginPercent));
    const recommendedPrice = roundToQuarter(priceFromMargin(realCost, form.recommendedMarginPercent));
    const premiumPrice = roundToQuarter(priceFromMargin(realCost, form.premiumMarginPercent));

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
      minimumMarginPercent: numberValue(form.minimumMarginPercent),
      recommendedMarginPercent: numberValue(form.recommendedMarginPercent),
      premiumMarginPercent: numberValue(form.premiumMarginPercent),
      wholesale5: roundToQuarter(recommendedPrice * (1 - numberValue(form.wholesale5Discount) / 100)),
      wholesale10: roundToQuarter(recommendedPrice * (1 - numberValue(form.wholesale10Discount) / 100)),
      wholesale20: roundToQuarter(recommendedPrice * (1 - numberValue(form.wholesale20Discount) / 100)),
      profitRecommended: recommendedPrice - realCost,
      marginRecommended: recommendedPrice > 0 ? ((recommendedPrice - realCost) / recommendedPrice) * 100 : 0
    };
  }, [form, selectedMaterial, extraMaterials]);

  const orderPreview = useMemo(() => {
    const total = result.recommendedPrice;
    const deposit = numberValue(orderDraft.deposit);
    const balance = Math.max(0, total - deposit);
    let paymentStatus = "No pagado";
    if (deposit >= total && total > 0) paymentStatus = "Pagado completo";
    else if (deposit > 0) paymentStatus = "Anticipo";
    return { total, deposit, balance, paymentStatus };
  }, [result.recommendedPrice, orderDraft.deposit]);

  const customers = useMemo(() => {
    const map = new Map();

    orders.forEach((order) => {
      const name = (order.customerName || "Cliente sin nombre").trim();
      const key = name.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          contact: order.contact || "",
          orders: [],
          totalSold: 0,
          balance: 0,
          profit: 0,
          lastOrderDate: order.createdAt || "",
          lastProduct: order.productName || ""
        });
      }

      const customer = map.get(key);
      customer.orders.push(order);
      customer.totalSold += numberValue(order.total);
      customer.balance += numberValue(order.balance);
      customer.profit += numberValue(order.profit);

      if (!customer.contact && order.contact) customer.contact = order.contact;

      if (!customer.lastOrderDate || String(order.createdAt) >= String(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt || "";
        customer.lastProduct = order.productName || "";
      }
    });

    return Array.from(map.values()).sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
  }, [orders]);

  const dashboard = useMemo(() => {
    const totals = orders.reduce((acc, order) => {
      acc.totalSold += numberValue(order.total);
      acc.balance += numberValue(order.balance);
      acc.profit += numberValue(order.profit);
      acc.realCost += numberValue(order.realCost);
      acc.deposit += numberValue(order.deposit);
      return acc;
    }, { totalSold: 0, balance: 0, profit: 0, realCost: 0, deposit: 0 });

    const byStatus = ORDER_STATUSES.map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length
    })).filter((item) => item.count > 0);

    const activeOrders = orders.filter((order) => !["Entregado", "Pagado", "Cancelado", "Devolución"].includes(order.status));
    const urgentOrders = orders.filter((order) => order.priority === "Urgente" || order.priority === "Alta");

    const upcomingOrders = orders
      .filter((order) => order.promisedDate && !["Entregado", "Pagado", "Cancelado", "Devolución"].includes(order.status))
      .sort((a, b) => String(a.promisedDate).localeCompare(String(b.promisedDate)))
      .slice(0, 5);

    const productMap = new Map();
    orders.forEach((order) => {
      const key = (order.productName || "Producto sin nombre").trim().toLowerCase();
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: order.productName || "Producto sin nombre",
          count: 0,
          total: 0,
          profit: 0
        });
      }
      const item = productMap.get(key);
      item.count += 1;
      item.total += numberValue(order.total);
      item.profit += numberValue(order.profit);
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      ...totals,
      orderCount: orders.length,
      customerCount: customers.length,
      activeOrders,
      urgentOrders,
      upcomingOrders,
      byStatus,
      topProducts
    };
  }, [orders, customers]);

  const loadCustomerToDraft = (customer) => {
    setOrderDraft((current) => ({
      ...current,
      customerName: customer.name,
      contact: customer.contact || current.contact
    }));
    setTab("calculator");
  };

  const resetPieceData = () => {
    setForm((current) => ({
      ...current,
      productName: "",
      modelGrams: 0,
      purgeGrams: 0
    }));
  };

  const resetProductionData = () => {
    setForm((current) => ({
      ...current,
      printHours: 0,
      printMinutes: 0,
      machineRate: 1.5,
      laborMinutes: 0,
      laborRate: 18,
      failureRate: 10,
      packagingCost: 0,
      hardwareCost: 0,
      amsEnabled: false,
      amsExtra: 0
    }));
  };

  const resetExtraMaterials = () => {
    setExtraMaterials([]);
  };

  const resetMargins = () => {
    setForm((current) => ({
      ...current,
      minimumMarginPercent: 40,
      recommendedMarginPercent: 60,
      premiumMarginPercent: 70
    }));
  };

  const resetOrderDraft = () => {
    setOrderDraft({
      customerName: "",
      contact: "",
      saleType: "En persona",
      status: "Cotizado",
      paymentMethod: "No definido",
      deposit: 0,
      promisedDate: "",
      priority: "Normal",
      notes: ""
    });
  };

  const resetCalculatorForm = () => {
    setForm(DEFAULT_FORM);
    setSelectedMaterialId(DEFAULT_MATERIALS[0].id);
    setExtraMaterials([]);
    resetOrderDraft();
  };

  const addSupply = () => {
    setSupplies((current) => [
      ...current,
      { id: crypto.randomUUID(), name: "Nuevo insumo", packageCost: 0, packageQuantity: 1 }
    ]);
  };

  const updateSupply = (id, key, value) => {
    setSupplies((current) => current.map((supply) => (supply.id === id ? { ...supply, [key]: value } : supply)));
  };

  const removeSupply = (id) => {
    setSupplies((current) => current.filter((supply) => supply.id !== id));
  };

  const applySupplyToExtra = (extraId, supplyId) => {
    if (supplyId === "manual") {
      updateExtraMaterial(extraId, "supplyId", "");
      return;
    }
    const supply = supplies.find((item) => item.id === supplyId);
    if (!supply) return;
    setExtraMaterials((current) =>
      current.map((item) =>
        item.id === extraId
          ? { ...item, supplyId, name: supply.name, unitCost: supplyUnitCost(supply).toFixed(4) }
          : item
      )
    );
  };

  const addExtraFromSupply = (supplyId) => {
    const supply = supplies.find((item) => item.id === supplyId);
    if (!supply) return;
    setExtraMaterials((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        supplyId: supply.id,
        name: supply.name,
        quantity: 1,
        unitCost: supplyUnitCost(supply).toFixed(4)
      }
    ]);
  };

  const addExtraMaterial = () => {
    setExtraMaterials((current) => [
      ...current,
      { id: crypto.randomUUID(), supplyId: "", name: "Material extra", quantity: 1, unitCost: 0 }
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

  const saveProduct = () => {
    const productName = form.productName?.trim() || "Producto sin nombre";
    const product = {
      id: crypto.randomUUID(),
      name: productName,
      date: new Date().toLocaleDateString(),
      selectedMaterialId,
      form: { ...form, productName },
      extraMaterials: extraMaterials.map((item) => ({ ...item })),
      preview: {
        grams: result.totalGrams,
        realCost: result.realCost,
        recommendedPrice: result.recommendedPrice,
        materialName: selectedMaterial?.name || "Material"
      }
    };
    setProducts((current) => [product, ...current]);
  };

  const loadProduct = (product) => {
    setForm(product.form);
    setSelectedMaterialId(product.selectedMaterialId);
    setExtraMaterials(product.extraMaterials || []);
    setTab("calculator");
  };

  const removeProduct = (id) => {
    setProducts((current) => current.filter((product) => product.id !== id));
  };

  const duplicateProduct = (product) => {
    const copy = {
      ...product,
      id: crypto.randomUUID(),
      name: `${product.name} copia`,
      date: new Date().toLocaleDateString()
    };
    setProducts((current) => [copy, ...current]);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "No definida";
    try {
      const date = new Date(`${dateValue}T00:00:00`);
      return date.toLocaleDateString("es-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateValue;
    }
  };

  const buildCustomerQuoteMessage = (order) => {
    const lines = [
      "Hola, te comparto tu cotización:",
      "",
      `Producto: ${order.productName}`,
      `Total: ${money(order.total)}`,
      `Anticipo: ${money(order.deposit)}`,
      `Saldo pendiente: ${money(order.balance)}`,
      `Estado: ${order.status}`,
      `Fecha estimada de entrega: ${formatDate(order.promisedDate)}`
    ];

    if (order.notes) {
      lines.push("", "Notas:", order.notes);
    }

    lines.push("", "Gracias.");
    return lines.join("\n");
  };

  const buildInternalSummaryMessage = (order) => {
    const lines = [
      `Pedido: ${order.customerName}`,
      `Contacto: ${order.contact || "Sin contacto"}`,
      `Producto: ${order.productName}`,
      `Material: ${order.materialName}`,
      `Venta: ${order.saleType}`,
      `Estado: ${order.status}`,
      `Pago: ${order.paymentStatus}`,
      `Método: ${order.paymentMethod}`,
      `Total: ${money(order.total)}`,
      `Anticipo: ${money(order.deposit)}`,
      `Saldo: ${money(order.balance)}`,
      `Costo real: ${money(order.realCost)}`,
      `Ganancia estimada: ${money(order.profit)}`,
      `Margen estimado: ${order.total > 0 ? (((order.total - order.realCost) / order.total) * 100).toFixed(1) : "0"}%`,
      `Prioridad: ${order.priority}`,
      `Fecha prometida: ${formatDate(order.promisedDate)}`
    ];

    if (order.notes) {
      lines.push(`Notas: ${order.notes}`);
    }

    return lines.join("\n");
  };

  const copyText = async (text, orderId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(""), 1800);
    } catch {
      window.prompt("Copia este texto:", text);
    }
  };

  const saveOrder = () => {
    const productName = form.productName?.trim() || "Producto sin nombre";
    const order = {
      id: crypto.randomUUID(),
      createdAt: todayISO(),
      customerName: orderDraft.customerName?.trim() || "Cliente sin nombre",
      contact: orderDraft.contact || "",
      productName,
      materialName: selectedMaterial?.name || "Material",
      saleType: orderDraft.saleType,
      status: orderDraft.status,
      paymentMethod: orderDraft.paymentMethod,
      paymentStatus: orderPreview.paymentStatus,
      priority: orderDraft.priority,
      promisedDate: orderDraft.promisedDate,
      notes: orderDraft.notes,
      deposit: orderPreview.deposit,
      total: orderPreview.total,
      balance: orderPreview.balance,
      realCost: result.realCost,
      profit: orderPreview.total - result.realCost,
      snapshot: {
        selectedMaterialId,
        form: { ...form, productName },
        extraMaterials: extraMaterials.map((item) => ({ ...item })),
        result: { ...result }
      }
    };
    setOrders((current) => [order, ...current]);
    setTab("orders");
  };

  const updateOrder = (id, key, value) => {
    setOrders((current) => current.map((order) => {
      if (order.id !== id) return order;
      const updated = { ...order, [key]: value };
      if (key === "deposit" || key === "total") {
        const total = numberValue(key === "total" ? value : updated.total);
        const deposit = numberValue(key === "deposit" ? value : updated.deposit);
        updated.balance = Math.max(0, total - deposit);
        updated.paymentStatus = deposit >= total && total > 0 ? "Pagado completo" : deposit > 0 ? "Anticipo" : "No pagado";
        updated.profit = total - numberValue(updated.realCost);
      }
      return updated;
    }));
  };

  const loadOrderToCalculator = (order) => {
    if (!order.snapshot) return;
    setForm(order.snapshot.form);
    setSelectedMaterialId(order.snapshot.selectedMaterialId);
    setExtraMaterials(order.snapshot.extraMaterials || []);
    setOrderDraft({
      customerName: order.customerName,
      contact: order.contact,
      saleType: order.saleType,
      status: order.status,
      paymentMethod: order.paymentMethod,
      deposit: order.deposit,
      promisedDate: order.promisedDate,
      priority: order.priority,
      notes: order.notes
    });
    setTab("calculator");
  };

  const removeOrder = (id) => setOrders((current) => current.filter((order) => order.id !== id));
  const removeQuote = (id) => setQuotes((current) => current.filter((quote) => quote.id !== id));

  const resetAll = () => {
    if (!confirm("¿Seguro que quieres borrar historial y restaurar valores?")) return;
    setMaterials(DEFAULT_MATERIALS);
    setSupplies(DEFAULT_SUPPLIES);
    setQuotes([]);
    setProducts([]);
    setOrders([]);
    setExtraMaterials(DEFAULT_EXTRAS);
    setForm(DEFAULT_FORM);
    setSelectedMaterialId(DEFAULT_MATERIALS[0].id);
    setOrderDraft({
      customerName: "",
      contact: "",
      saleType: "En persona",
      status: "Cotizado",
      paymentMethod: "No definido",
      deposit: 0,
      promisedDate: "",
      priority: "Normal",
      notes: ""
    });
  };

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">MVP v8 · Insumos</p>
          <h1>Calculadora de Precios 3D</h1>
          <p>Cotiza, guarda pedidos, administra insumos frecuentes y limpia formularios por sección.</p>
        </div>
        <div className="hero-actions">
          <button className="ghost" onClick={resetCalculatorForm}>Limpiar formulario</button>
          <button className="ghost danger-ghost" onClick={resetAll}>Restaurar app</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Dashboard</button>
        <button className={tab === "calculator" ? "active" : ""} onClick={() => setTab("calculator")}>Calculadora</button>
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Productos</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Pedidos</button>
        <button className={tab === "customers" ? "active" : ""} onClick={() => setTab("customers")}>Clientes</button>
        <button className={tab === "materials" ? "active" : ""} onClick={() => setTab("materials")}>Materiales</button>
        <button className={tab === "supplies" ? "active" : ""} onClick={() => setTab("supplies")}>Insumos</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>Historial</button>
      </nav>

      {tab === "dashboard" && (
        <section className="single">
          <div className="dashboard-grid">
            <Card title="Resumen general">
              <div className="metric-grid">
                <div className="metric-card">
                  <span>Ventas totales</span>
                  <strong>{money(dashboard.totalSold)}</strong>
                </div>
                <div className="metric-card">
                  <span>Ganancia estimada</span>
                  <strong>{money(dashboard.profit)}</strong>
                </div>
                <div className="metric-card warning">
                  <span>Saldo por cobrar</span>
                  <strong>{money(dashboard.balance)}</strong>
                </div>
                <div className="metric-card">
                  <span>Pedidos</span>
                  <strong>{dashboard.orderCount}</strong>
                </div>
                <div className="metric-card">
                  <span>Clientes</span>
                  <strong>{dashboard.customerCount}</strong>
                </div>
                <div className="metric-card">
                  <span>Anticipos recibidos</span>
                  <strong>{money(dashboard.deposit)}</strong>
                </div>
              </div>
            </Card>

            <Card title="Pedidos activos">
              {dashboard.activeOrders.length === 0 ? (
                <p className="empty">No tienes pedidos activos.</p>
              ) : (
                <div className="compact-list">
                  {dashboard.activeOrders.slice(0, 6).map((order) => (
                    <div className="compact-row" key={order.id}>
                      <div>
                        <strong>{order.customerName}</strong>
                        <p>{order.productName} · {order.status}</p>
                      </div>
                      <div className="compact-money">
                        <span>Saldo</span>
                        <strong>{money(order.balance)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="dashboard-grid">
            <Card title="Estado de pedidos">
              {dashboard.byStatus.length === 0 ? (
                <p className="empty">Aún no hay estados para mostrar.</p>
              ) : (
                <div className="status-list">
                  {dashboard.byStatus.map((item) => (
                    <div className="status-row" key={item.status}>
                      <span>{item.status}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Próximas entregas">
              {dashboard.upcomingOrders.length === 0 ? (
                <p className="empty">No hay entregas programadas.</p>
              ) : (
                <div className="compact-list">
                  {dashboard.upcomingOrders.map((order) => (
                    <div className="compact-row" key={order.id}>
                      <div>
                        <strong>{formatDate(order.promisedDate)}</strong>
                        <p>{order.customerName} · {order.productName}</p>
                      </div>
                      <span className={`badge ${order.priority?.toLowerCase()}`}>{order.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="dashboard-grid">
            <Card title="Productos con más venta">
              {dashboard.topProducts.length === 0 ? (
                <p className="empty">Aún no hay productos vendidos.</p>
              ) : (
                <div className="compact-list">
                  {dashboard.topProducts.map((product) => (
                    <div className="compact-row" key={product.name}>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.count} pedido{product.count === 1 ? "" : "s"} · Ganancia {money(product.profit)}</p>
                      </div>
                      <div className="compact-money">
                        <span>Total</span>
                        <strong>{money(product.total)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Alertas rápidas">
              <div className="alert-list">
                <div className={dashboard.balance > 0 ? "alert-card warning" : "alert-card"}>
                  <strong>{dashboard.balance > 0 ? "Hay saldo pendiente por cobrar" : "Sin saldo pendiente"}</strong>
                  <p>{dashboard.balance > 0 ? `Tienes ${money(dashboard.balance)} pendientes.` : "Todo está cobrado por ahora."}</p>
                </div>
                <div className={dashboard.urgentOrders.length > 0 ? "alert-card danger-alert" : "alert-card"}>
                  <strong>{dashboard.urgentOrders.length > 0 ? "Pedidos de prioridad alta/urgente" : "Sin urgencias"}</strong>
                  <p>{dashboard.urgentOrders.length > 0 ? `${dashboard.urgentOrders.length} pedido(s) requieren atención.` : "No hay pedidos marcados como alta prioridad."}</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {tab === "calculator" && (
        <section className="layout">
          <div className="left">
            <Card title="Datos de la pieza">
              <div className="section-actions">
                <button className="mini-button" onClick={resetPieceData}>Limpiar datos de pieza</button>
              </div>
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
              <div className="section-actions">
                <button className="mini-button" onClick={resetProductionData}>Limpiar producción</button>
              </div>
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
              <div className="section-actions">
                <button className="mini-button" onClick={resetExtraMaterials}>Limpiar materiales extra</button>
              </div>
              <p className="muted">Elige insumos guardados o escribe un material manual si no aparece.</p>

              <div className="quick-supplies">
                {supplies.slice(0, 8).map((supply) => (
                  <button key={supply.id} className="chip-button" onClick={() => addExtraFromSupply(supply.id)}>
                    + {supply.name}
                  </button>
                ))}
              </div>

              <div className="extras">
                {extraMaterials.map((item) => (
                  <div className="extra-row enhanced" key={item.id}>
                    <Field label="Insumo guardado">
                      <select value={item.supplyId || "manual"} onChange={(e) => applySupplyToExtra(item.id, e.target.value)}>
                        <option value="manual">Manual / no está en lista</option>
                        {supplies.map((supply) => (
                          <option key={supply.id} value={supply.id}>{supply.name} — {money(supplyUnitCost(supply))} c/u</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Material">
                      <input value={item.name} onChange={(e) => updateExtraMaterial(item.id, "name", e.target.value)} />
                    </Field>
                    <Field label="Cantidad">
                      <input type="number" step="1" value={item.quantity} onChange={(e) => updateExtraMaterial(item.id, "quantity", e.target.value)} />
                    </Field>
                    <Field label="Costo unitario">
                      <input type="number" step="0.0001" value={item.unitCost} onChange={(e) => updateExtraMaterial(item.id, "unitCost", e.target.value)} />
                    </Field>
                    <button className="danger" onClick={() => removeExtraMaterial(item.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
              <div className="total-line">
                <span>Total materiales extra</span>
                <strong>{money(result.extraMaterialsCost)}</strong>
              </div>
              <button className="secondary" onClick={addExtraMaterial}>Agregar material manual</button>
            </Card>

            <Card title="Margen y precio">
              <div className="section-actions">
                <button className="mini-button" onClick={resetMargins}>Restaurar márgenes</button>
              </div>
              <p className="muted">Aquí pones el margen real que quieres ganar. La fórmula usada es: Precio = Costo real ÷ (1 - margen).</p>
              <div className="grid3">
                <Field label="Margen mínimo (%)">
                  <input type="number" min="0" max="95" value={form.minimumMarginPercent} onChange={(e) => update("minimumMarginPercent", e.target.value)} />
                </Field>
                <Field label="Margen recomendado (%)">
                  <input type="number" min="0" max="95" value={form.recommendedMarginPercent} onChange={(e) => update("recommendedMarginPercent", e.target.value)} />
                </Field>
                <Field label="Margen premium (%)">
                  <input type="number" min="0" max="95" value={form.premiumMarginPercent} onChange={(e) => update("premiumMarginPercent", e.target.value)} />
                </Field>
              </div>
              <div className="margin-examples">
                <div><span>Mínimo</span><strong>{result.minimumMarginPercent.toFixed(0)}%</strong><p>{money(result.minimumPrice)}</p></div>
                <div><span>Recomendado</span><strong>{result.recommendedMarginPercent.toFixed(0)}%</strong><p>{money(result.recommendedPrice)}</p></div>
                <div><span>Premium</span><strong>{result.premiumMarginPercent.toFixed(0)}%</strong><p>{money(result.premiumPrice)}</p></div>
              </div>
            </Card>

            <Card title="Datos del pedido">
              <div className="section-actions">
                <button className="mini-button" onClick={resetOrderDraft}>Limpiar datos del pedido</button>
              </div>
              <p className="muted">Llena esto cuando quieras convertir la cotización actual en pedido/cotización para un cliente.</p>
              <div className="grid2">
                <Field label="Cliente">
                  <input value={orderDraft.customerName} onChange={(e) => updateOrderDraft("customerName", e.target.value)} placeholder="Nombre del cliente" />
                </Field>
                <Field label="Contacto">
                  <input value={orderDraft.contact} onChange={(e) => updateOrderDraft("contact", e.target.value)} placeholder="Teléfono, Instagram, WhatsApp..." />
                </Field>
                <Field label="Tipo de venta">
                  <select value={orderDraft.saleType} onChange={(e) => updateOrderDraft("saleType", e.target.value)}>
                    {SALE_TYPES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Estado del pedido">
                  <select value={orderDraft.status} onChange={(e) => updateOrderDraft("status", e.target.value)}>
                    {ORDER_STATUSES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Método de pago">
                  <select value={orderDraft.paymentMethod} onChange={(e) => updateOrderDraft("paymentMethod", e.target.value)}>
                    {PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Anticipo recibido">
                  <input type="number" step="0.01" value={orderDraft.deposit} onChange={(e) => updateOrderDraft("deposit", e.target.value)} />
                </Field>
                <Field label="Fecha prometida">
                  <input type="date" value={orderDraft.promisedDate} onChange={(e) => updateOrderDraft("promisedDate", e.target.value)} />
                </Field>
                <Field label="Prioridad">
                  <select value={orderDraft.priority} onChange={(e) => updateOrderDraft("priority", e.target.value)}>
                    {PRIORITIES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Notas">
                <textarea value={orderDraft.notes} onChange={(e) => updateOrderDraft("notes", e.target.value)} placeholder="Color, personalización, fecha, detalles..." />
              </Field>
              <div className="order-preview">
                <div><span>Total</span><strong>{money(orderPreview.total)}</strong></div>
                <div><span>Anticipo</span><strong>{money(orderPreview.deposit)}</strong></div>
                <div><span>Saldo</span><strong>{money(orderPreview.balance)}</strong></div>
                <div><span>Pago</span><strong>{orderPreview.paymentStatus}</strong></div>
              </div>
              <button className="secondary" onClick={saveOrder}>Guardar pedido / cotización</button>
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
                <p>Margen recomendado: <strong>{result.marginRecommended.toFixed(1)}%</strong></p>
              </div>

              <div className="action-grid">
                <button className="primary" onClick={saveQuote}>Guardar cotización simple</button>
                <button className="secondary light" onClick={saveProduct}>Guardar producto</button>
                <button className="secondary light" onClick={saveOrder}>Guardar pedido</button>
              </div>
            </Card>

            <Card title="Mayoreo sugerido">
              <PriceRow label="5 piezas" value={`${money(result.wholesale5)} c/u`} />
              <PriceRow label="10 piezas" value={`${money(result.wholesale10)} c/u`} />
              <PriceRow label="20 piezas" value={`${money(result.wholesale20)} c/u`} />
            </Card>
          </aside>
        </section>
      )}

      {tab === "products" && (
        <section className="single">
          <Card title="Productos guardados">
            <p className="muted">Guarda productos que repites seguido. Luego puedes cargarlos a la calculadora con un clic.</p>
            <button className="secondary" onClick={saveProduct}>Guardar producto actual</button>
            {products.length === 0 ? (
              <p className="empty">Aún no has guardado productos.</p>
            ) : (
              <div className="product-list">
                {products.map((product) => (
                  <div className="product-card" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.date} · {product.preview?.materialName || "Material"} · {Number(product.preview?.grams || 0).toFixed(1)} g</p>
                      <p>Costo real: <b>{money(product.preview?.realCost || 0)}</b> · Recomendado: <b>{money(product.preview?.recommendedPrice || 0)}</b></p>
                    </div>
                    <div className="product-actions">
                      <button className="primary small" onClick={() => loadProduct(product)}>Cargar</button>
                      <button className="secondary small" onClick={() => duplicateProduct(product)}>Duplicar</button>
                      <button className="danger small" onClick={() => removeProduct(product.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {tab === "orders" && (
        <section className="single">
          <Card title="Pedidos / Cotizaciones">
            <p className="muted">Aquí quedan las cotizaciones vinculadas a clientes, con estado, anticipo, saldo y fecha prometida.</p>
            {orders.length === 0 ? (
              <p className="empty">Aún no has guardado pedidos.</p>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <div className="order-card" key={order.id}>
                    <div className="order-head">
                      <div>
                        <strong>{order.customerName}</strong>
                        <p>{order.productName} · {order.createdAt}</p>
                      </div>
                      <span className={`badge ${order.priority?.toLowerCase()}`}>{order.priority}</span>
                    </div>

                    <div className="order-grid">
                      <Field label="Estado">
                        <select value={order.status} onChange={(e) => updateOrder(order.id, "status", e.target.value)}>
                          {ORDER_STATUSES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                      <Field label="Tipo de venta">
                        <select value={order.saleType} onChange={(e) => updateOrder(order.id, "saleType", e.target.value)}>
                          {SALE_TYPES.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                      <Field label="Método de pago">
                        <select value={order.paymentMethod} onChange={(e) => updateOrder(order.id, "paymentMethod", e.target.value)}>
                          {PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                      <Field label="Anticipo">
                        <input type="number" step="0.01" value={order.deposit} onChange={(e) => updateOrder(order.id, "deposit", e.target.value)} />
                      </Field>
                      <Field label="Total">
                        <input type="number" step="0.01" value={order.total} onChange={(e) => updateOrder(order.id, "total", e.target.value)} />
                      </Field>
                      <Field label="Fecha prometida">
                        <input type="date" value={order.promisedDate || ""} onChange={(e) => updateOrder(order.id, "promisedDate", e.target.value)} />
                      </Field>
                    </div>

                    <div className="order-summary">
                      <div><span>Total</span><strong>{money(order.total)}</strong></div>
                      <div><span>Saldo</span><strong>{money(order.balance)}</strong></div>
                      <div><span>Ganancia est.</span><strong>{money(order.profit)}</strong></div>
                      <div><span>Pago</span><strong>{order.paymentStatus}</strong></div>
                    </div>

                    {order.contact && <p className="muted"><b>Contacto:</b> {order.contact}</p>}
                    {order.notes && <p className="muted"><b>Notas:</b> {order.notes}</p>}

                    <div className="copy-box">
                      <strong>Texto rápido para cliente</strong>
                      <pre>{buildCustomerQuoteMessage(order)}</pre>
                      {copiedOrderId === order.id && <p className="copied">Copiado al portapapeles ✅</p>}
                    </div>

                    <div className="product-actions">
                      <button className="primary small" onClick={() => copyText(buildCustomerQuoteMessage(order), order.id)}>Copiar cotización</button>
                      <button className="secondary small" onClick={() => copyText(buildInternalSummaryMessage(order), order.id)}>Copiar resumen interno</button>
                      <button className="secondary small" onClick={() => setPrintOrder(order)}>Vista imprimible</button>
                      <button className="secondary small" onClick={() => loadOrderToCalculator(order)}>Cargar/editar</button>
                      <button className="danger small" onClick={() => removeOrder(order.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {tab === "customers" && (
        <section className="single">
          <Card title="Clientes">
            <p className="muted">La lista se crea automáticamente usando los pedidos guardados. Si un cliente tiene varios pedidos, aquí se agrupan.</p>
            {customers.length === 0 ? (
              <p className="empty">Aún no hay clientes. Guarda pedidos para que aparezcan aquí.</p>
            ) : (
              <div className="customer-list">
                {customers.map((customer) => (
                  <div className="customer-card" key={customer.id}>
                    <div className="customer-head">
                      <div>
                        <strong>{customer.name}</strong>
                        <p>{customer.contact || "Sin contacto registrado"}</p>
                      </div>
                      <span className="badge">{customer.orders.length} pedido{customer.orders.length === 1 ? "" : "s"}</span>
                    </div>

                    <div className="customer-summary">
                      <div><span>Total vendido</span><strong>{money(customer.totalSold)}</strong></div>
                      <div><span>Saldo pendiente</span><strong>{money(customer.balance)}</strong></div>
                      <div><span>Ganancia est.</span><strong>{money(customer.profit)}</strong></div>
                      <div><span>Último pedido</span><strong>{customer.lastProduct || "N/A"}</strong></div>
                    </div>

                    <details className="customer-details">
                      <summary>Ver pedidos del cliente</summary>
                      <div className="customer-orders">
                        {customer.orders.map((order) => (
                          <div className="customer-order-row" key={order.id}>
                            <div>
                              <strong>{order.productName}</strong>
                              <p>{order.createdAt} · {order.status} · {order.paymentStatus}</p>
                            </div>
                            <div className="customer-order-money">
                              <span>Total</span>
                              <strong>{money(order.total)}</strong>
                            </div>
                            <button className="secondary small" onClick={() => loadOrderToCalculator(order)}>Cargar</button>
                          </div>
                        ))}
                      </div>
                    </details>

                    <div className="product-actions">
                      <button className="primary small" onClick={() => loadCustomerToDraft(customer)}>Nuevo pedido para este cliente</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      )}

      {tab === "supplies" && (
        <section className="single">
          <Card title="Insumos / Extras guardados">
            <p className="muted">Guarda cosas que compras por paquete: argollas, imanes, bolsas, stickers, LEDs, tornillos, etc. La app calcula el costo unitario automático.</p>
            <button className="secondary" onClick={addSupply}>Agregar insumo</button>
            <div className="supply-list">
              {supplies.map((supply) => (
                <div className="supply-card" key={supply.id}>
                  <Field label="Nombre del insumo">
                    <input value={supply.name} onChange={(e) => updateSupply(supply.id, "name", e.target.value)} />
                  </Field>
                  <Field label="Costo del paquete">
                    <input type="number" step="0.01" value={supply.packageCost} onChange={(e) => updateSupply(supply.id, "packageCost", e.target.value)} />
                  </Field>
                  <Field label="Cantidad por paquete">
                    <input type="number" step="1" value={supply.packageQuantity} onChange={(e) => updateSupply(supply.id, "packageQuantity", e.target.value)} />
                  </Field>
                  <div className="unit-cost-box">
                    <span>Costo unitario</span>
                    <strong>{money(supplyUnitCost(supply))}</strong>
                  </div>
                  <button className="danger" onClick={() => removeSupply(supply.id)}>Eliminar</button>
                </div>
              ))}
            </div>
          </Card>
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
          <Card title="Historial de cotizaciones simples">
            {quotes.length === 0 ? (
              <p className="empty">Aún no has guardado cotizaciones simples.</p>
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
      {printOrder && (
        <div className="print-overlay">
          <div className="print-panel">
            <div className="print-actions no-print">
              <button className="ghost" onClick={() => setPrintOrder(null)}>Cerrar</button>
              <button className="secondary" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
            </div>

            <section className="quote-sheet">
              <div className="quote-header">
                <div>
                  <p className="quote-label">Cotización de impresión 3D</p>
                  <h1>{printOrder.productName}</h1>
                </div>
                <div className="quote-total">
                  <span>Total</span>
                  <strong>{money(printOrder.total)}</strong>
                </div>
              </div>

              <div className="quote-meta">
                <div><span>Cliente</span><strong>{printOrder.customerName}</strong></div>
                <div><span>Contacto</span><strong>{printOrder.contact || "No registrado"}</strong></div>
                <div><span>Fecha</span><strong>{formatDate(printOrder.createdAt)}</strong></div>
                <div><span>Entrega estimada</span><strong>{formatDate(printOrder.promisedDate)}</strong></div>
              </div>

              <div className="quote-section">
                <h2>Detalle del pedido</h2>
                <table>
                  <tbody>
                    <tr><td>Producto</td><td>{printOrder.productName}</td></tr>
                    <tr><td>Material</td><td>{printOrder.materialName}</td></tr>
                    <tr><td>Tipo de venta</td><td>{printOrder.saleType}</td></tr>
                    <tr><td>Estado</td><td>{printOrder.status}</td></tr>
                    <tr><td>Prioridad</td><td>{printOrder.priority}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="quote-section">
                <h2>Pago</h2>
                <table>
                  <tbody>
                    <tr><td>Total</td><td>{money(printOrder.total)}</td></tr>
                    <tr><td>Anticipo</td><td>{money(printOrder.deposit)}</td></tr>
                    <tr><td>Saldo pendiente</td><td>{money(printOrder.balance)}</td></tr>
                    <tr><td>Estado de pago</td><td>{printOrder.paymentStatus}</td></tr>
                    <tr><td>Método de pago</td><td>{printOrder.paymentMethod}</td></tr>
                  </tbody>
                </table>
              </div>

              {printOrder.notes && (
                <div className="quote-section">
                  <h2>Notas</h2>
                  <p>{printOrder.notes}</p>
                </div>
              )}

              <div className="quote-footer">
                <p>Gracias por tu pedido.</p>
                <p className="fine-print">Cotización válida según especificaciones acordadas. Cambios de material, tamaño, cantidad o diseño pueden modificar el precio final.</p>
              </div>
            </section>
          </div>
        </div>
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
