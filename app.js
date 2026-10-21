(() => {
  "use strict";
  const KEY = "mpn36_v2_data";
  const $ = id => document.getElementById(id);
  const today = () => new Date().toLocaleDateString("en-CA");
  const CURRENCY_LOCALES = {
    MXN:"es-MX", USD:"en-US", EUR:"es-ES", COP:"es-CO", ARS:"es-AR", CLP:"es-CL",
    PEN:"es-PE", BRL:"pt-BR", GBP:"en-GB", JPY:"ja-JP", CAD:"en-CA", AUD:"en-AU",
    CHF:"de-CH", CNY:"zh-CN", INR:"en-IN", KRW:"ko-KR", PAB:"es-PA", UYU:"es-UY",
    DOP:"es-DO", GTQ:"es-GT", CRC:"es-CR", BOB:"es-BO", PYG:"es-PY", HNL:"es-HN",
    NIO:"es-NI", SEK:"sv-SE", NOK:"nb-NO", NZD:"en-NZ", SGD:"en-SG", ZAR:"en-ZA"
  };
  const money = n => {
    const code = data?.settings?.currency || "MXN";
    const locale = CURRENCY_LOCALES[code] || "es-MX";
    try { return new Intl.NumberFormat(locale,{style:"currency",currency:code}).format(Number(n)||0); }
    catch { return `${code} ${(Number(n)||0).toFixed(2)}`; }
  };
  const uid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let data = loadData(), salesChart = null;
  function loadData(){
    try {
      const raw = localStorage.getItem(KEY);
      if(raw){ const d=JSON.parse(raw); return {...d, products:d.products||[],sales:d.sales||[],expenses:d.expenses||[],stockMoves:d.stockMoves||[],settings:{...(d.settings||{}),currency:(d.settings&&d.settings.currency)||"MXN"}}; }
    } catch(e) { console.error(e); }
    // No se borran ni sobrescriben datos antiguos con nombres de clave desconocidos.
    return {products:[],sales:[],expenses:[],stockMoves:[],settings:{currency:"MXN"}};
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(data)); renderAll(); }
  function toast(msg){ const el=$("toast"); el.textContent=msg; el.classList.remove("hidden"); setTimeout(()=>el.classList.add("hidden"),2800); }
  function num(id){ return Number($(id).value)||0; }
  function product(id){ return data.products.find(p=>p.id===id); }
  function productCost(p){ return Number(p.materials)+Number(p.labor); }
  function addDays(date, n){ const d=new Date(date+"T12:00:00"); d.setDate(d.getDate()+n); return d.toLocaleDateString("en-CA"); }
  function inRange(date, from, to){ return (!from || date>=from) && (!to || date<=to); }
  function currentPeriod(){
    const period=$("dashboardPeriod").value;
    if(period==="all") return {from:"",to:today()};
    if(period==="today") return {from:today(),to:today()};
    return {from:addDays(today(),-(Number(period)-1)),to:today()};
  }
  function totals(from="",to=""){
    const ss=data.sales.filter(s=>inRange(s.date,from,to));
    const es=data.expenses.filter(e=>inRange(e.date,from,to));
    const revenue=ss.reduce((a,s)=>a+s.price*s.qty,0);
    const costs=ss.reduce((a,s)=>a+s.cost*s.qty,0);
    const gross=revenue-costs;
    const expenseTotal=es.reduce((a,e)=>a+e.amount,0);
    return {ss,es,revenue,costs,gross,expenseTotal,net:gross-expenseTotal};
  }
  function emptyRow(cols,msg="Sin registros todavía"){return `<tr><td colspan="${cols}" class="empty">${msg}</td></tr>`;}
  function renderProductOptions(){
    const opts=data.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (stock: ${p.stock})</option>`).join("");
    $("stockProduct").innerHTML=opts || '<option value="">Agrega primero un producto</option>';
    $("saleProduct").innerHTML=opts || '<option value="">Agrega primero un producto</option>';
    updateSalePreview();
  }
  function renderProducts(){
    const q=$("productSearch").value.trim().toLowerCase();
    const list=data.products.filter(p=>p.name.toLowerCase().includes(q));
    $("productRows").innerHTML=list.map(p=>`<tr><td>${escapeHtml(p.name)}</td><td>${money(productCost(p))}</td><td>${money(p.price)}</td><td>${money(p.price-productCost(p))}</td><td>${p.stock}</td><td><button class="row-button" data-edit-product="${p.id}">Editar</button><button class="row-button danger" data-delete-product="${p.id}">Eliminar</button></td></tr>`).join("")||emptyRow(6);
    $("stockRows").innerHTML=data.stockMoves.slice().reverse().map(m=>`<tr><td>${escapeHtml(m.date)}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.typeLabel)}</td><td>${m.qty}</td><td>${escapeHtml(m.reason||"—")}</td></tr>`).join("")||emptyRow(5);
    renderProductOptions();
  }
  function renderSales(){
    $("saleRows").innerHTML=data.sales.slice().reverse().map(s=>`<tr><td>${escapeHtml(s.date)}</td><td>${escapeHtml(s.name)}</td><td>${s.qty}</td><td>${money(s.price)}</td><td>${money(s.qty*s.price)}</td><td><button class="row-button danger" data-delete-sale="${s.id}">Eliminar</button></td></tr>`).join("")||emptyRow(6);
  }
  function renderExpenses(){
    $("expenseRows").innerHTML=data.expenses.slice().reverse().map(e=>`<tr><td>${escapeHtml(e.date)}</td><td>${escapeHtml(e.name)}</td><td>${e.type==="fixed"?"Fijo":"Variable"}</td><td>${money(e.amount)}</td><td><button class="row-button danger" data-delete-expense="${e.id}">Eliminar</button></td></tr>`).join("")||emptyRow(5);
    $("expenseTotal").textContent=money(data.expenses.reduce((a,e)=>a+e.amount,0));
  }
  function renderDashboard(){
    const {from,to}=currentPeriod(), t=totals(from,to);
    $("metricSales").textContent=money(t.revenue); $("metricCosts").textContent=money(t.costs);
    $("metricGross").textContent=money(t.gross); $("metricNet").textContent=money(t.net);
    const low=data.products.filter(p=>p.stock<=p.minStock);
    $("lowStockRows").innerHTML=low.map(p=>`<tr><td>${escapeHtml(p.name)}</td><td>${p.stock}</td><td>${p.minStock}</td><td><span class="status low">Stock bajo</span></td></tr>`).join("")||emptyRow(4,"No hay productos con stock bajo");
    $("inventorySummary").innerHTML=`<div class="inventory-box"><span>Productos registrados</span><strong>${data.products.length}</strong></div><div class="inventory-box"><span>Unidades disponibles</span><strong>${data.products.reduce((a,p)=>a+p.stock,0)}</strong></div><div class="inventory-box"><span>Productos con stock bajo</span><strong>${low.length}</strong></div><div class="inventory-box"><span>Valor a costo actual*</span><strong>${money(data.products.reduce((a,p)=>a+p.stock*productCost(p),0))}</strong></div>`;
    const dates=[]; for(let i=6;i>=0;i--) dates.push(addDays(today(),-i));
    const labels=dates.map(d=>d.slice(5));
    const rev=dates.map(d=>data.sales.filter(s=>s.date===d).reduce((a,s)=>a+s.price*s.qty,0));
    const cost=dates.map(d=>data.sales.filter(s=>s.date===d).reduce((a,s)=>a+s.cost*s.qty,0));
    if(window.Chart){
      if(salesChart) salesChart.destroy();
      salesChart=new Chart($("salesChart"),{type:"bar",data:{labels,datasets:[{label:"Ventas",data:rev,backgroundColor:"#2563eb",borderRadius:5},{label:"Costo vendido",data:cost,backgroundColor:"#cbd5e1",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom"}},scales:{y:{beginAtZero:true,ticks:{callback:v=>`${data.settings.currency} ${v}`}}}}});
    } else {$("salesChart").insertAdjacentHTML("afterend","<p>Para ver la gráfica, abre la página con conexión a internet.</p>");}
  }
  function reportRange(){return {from:$("reportFrom").value,to:$("reportTo").value};}
  function renderReport(){
    const {from,to}=reportRange(), t=totals(from,to);
    $("reportSales").textContent=money(t.revenue); $("reportCosts").textContent=money(t.costs);
    $("reportExpenses").textContent=money(t.expenseTotal); $("reportNet").textContent=money(t.net);
    const groups={};
    t.ss.forEach(s=>{const g=groups[s.productId]||(groups[s.productId]={name:s.name,qty:0,revenue:0,cost:0});g.qty+=s.qty;g.revenue+=s.qty*s.price;g.cost+=s.qty*s.cost;});
    $("reportProductRows").innerHTML=Object.values(groups).map(g=>`<tr><td>${escapeHtml(g.name)}</td><td>${g.qty}</td><td>${money(g.revenue)}</td><td>${money(g.revenue-g.cost)}</td></tr>`).join("")||emptyRow(4,"No hay ventas en este periodo");
  }
  function renderAll(){renderProducts();renderSales();renderExpenses();renderDashboard();renderReport();}
  function updateSalePreview(){
    const p=product($("saleProduct").value), qty=Math.max(0,num("saleQty")), price=$("salePrice").value===""?(p?p.price:0):num("salePrice");
    $("saleStock").textContent=p?String(p.stock):"—"; $("saleTotal").textContent=money(qty*price);
    if(p && $("salePrice").value==="") $("salePrice").value=p.price;
  }
  function go(view){
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!=="view-"+view));
    document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    if(view==="dashboard") renderDashboard(); if(view==="reports") renderReport();
  }
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.goto)));
  $("productForm").addEventListener("submit",e=>{
    e.preventDefault();
    const id=$("productId").value, name=$("productName").value.trim();
    const materials=num("productMaterials"), labor=num("productLabor"), price=num("productPrice"), stock=num("productStock"), minStock=num("productMinStock");
    if(!name || [materials,labor,price,stock,minStock].some(v=>v<0) || !Number.isInteger(stock)||!Number.isInteger(minStock)){toast("Revisa los datos del producto.");return;}
    if(id){const p=product(id); if(!p)return; p.name=name;p.materials=materials;p.labor=labor;p.price=price;p.minStock=minStock;
      const diff=stock-p.stock;if(diff!==0){p.stock=stock;data.stockMoves.push({id:uid(),date:today(),productId:id,name,typeLabel:"Ajuste por edición",qty:Math.abs(diff),reason:"Actualización de existencias"});}
      toast("Producto actualizado.");
    } else {data.products.push({id:uid(),name,materials,labor,price,stock,minStock,createdAt:today()});toast("Producto agregado.");}
    $("productForm").reset();$("productId").value="";$("productLabor").value="0";$("productStock").value="0";$("productMinStock").value="3";$("productSubmit").textContent="Agregar producto";$("cancelProductEdit").classList.add("hidden");save();
  });
  $("cancelProductEdit").addEventListener("click",()=>{$("productForm").reset();$("productId").value="";$("productLabor").value="0";$("productStock").value="0";$("productMinStock").value="3";$("productSubmit").textContent="Agregar producto";$("cancelProductEdit").classList.add("hidden");});
  $("productRows").addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit-product]"), del=e.target.closest("[data-delete-product]");
    if(edit){const p=product(edit.dataset.editProduct);if(!p)return;$("productId").value=p.id;$("productName").value=p.name;$("productMaterials").value=p.materials;$("productLabor").value=p.labor;$("productPrice").value=p.price;$("productStock").value=p.stock;$("productMinStock").value=p.minStock;$("productSubmit").textContent="Guardar cambios";$("cancelProductEdit").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"});}
    if(del){const id=del.dataset.deleteProduct;if(data.sales.some(s=>s.productId===id)){toast("No se puede eliminar: tiene ventas relacionadas.");return;}if(confirm("¿Eliminar este producto?")){data.products=data.products.filter(p=>p.id!==id);save();toast("Producto eliminado.");}}
  });
  $("stockForm").addEventListener("submit",e=>{
    e.preventDefault();const p=product($("stockProduct").value),qty=num("stockQty"),type=$("stockType").value,reason=$("stockReason").value.trim();
    if(!p||!Number.isInteger(qty)||qty<1){toast("Selecciona producto y cantidad válida.");return;}
    if(type==="out"&&qty>p.stock){toast("No hay suficientes existencias para esa salida.");return;}
    const old=p.stock;
    if(type==="in")p.stock+=qty; else if(type==="out")p.stock-=qty; else p.stock=qty;
    const delta=Math.abs(p.stock-old),label=type==="in"?"Entrada":type==="out"?"Salida / pérdida":"Ajuste";
    data.stockMoves.push({id:uid(),date:today(),productId:p.id,name:p.name,typeLabel:label,qty:delta,reason:reason||"Sin especificar"});
    $("stockForm").reset();save();toast("Inventario actualizado.");
  });
  $("saleProduct").addEventListener("change",()=>{$("salePrice").value=product($("saleProduct").value)?.price??"";updateSalePreview();});
  $("saleQty").addEventListener("input",updateSalePreview);$("salePrice").addEventListener("input",updateSalePreview);
  $("saleForm").addEventListener("submit",e=>{
    e.preventDefault();const p=product($("saleProduct").value),qty=num("saleQty"),price=num("salePrice"),date=$("saleDate").value;
    if(!p||!Number.isInteger(qty)||qty<1||price<0||!date){toast("Revisa los datos de la venta.");return;}
    if(qty>p.stock){toast("Inventario insuficiente. Disponibles: "+p.stock);return;}
    p.stock-=qty;
    data.sales.push({id:uid(),productId:p.id,name:p.name,qty,price,cost:productCost(p),date});
    data.stockMoves.push({id:uid(),date,productId:p.id,name:p.name,typeLabel:"Venta",qty,reason:"Descuento automático"});
    $("saleQty").value="1";save();toast("Venta registrada e inventario actualizado.");
  });
  $("saleRows").addEventListener("click",e=>{
    const b=e.target.closest("[data-delete-sale]");if(!b)return;
    if(!confirm("¿Eliminar esta venta? Se devolverán las unidades al inventario."))return;
    const s=data.sales.find(x=>x.id===b.dataset.deleteSale);if(!s)return;
    const p=product(s.productId);if(p)p.stock+=s.qty;
    data.sales=data.sales.filter(x=>x.id!==s.id);
    data.stockMoves.push({id:uid(),date:today(),productId:s.productId,name:s.name,typeLabel:"Reversión de venta",qty:s.qty,reason:"Venta eliminada"});
    save();toast("Venta eliminada y stock restaurado.");
  });
  $("expenseForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("expenseName").value.trim(),amount=num("expenseAmount"),date=$("expenseDate").value;
    if(!name||amount<=0||!date){toast("Revisa los datos del gasto.");return;}
    data.expenses.push({id:uid(),name,amount,date,type:$("expenseType").value});$("expenseForm").reset();$("expenseDate").value=today();save();toast("Gasto agregado.");
  });
  $("expenseRows").addEventListener("click",e=>{
    const b=e.target.closest("[data-delete-expense]");if(!b)return;
    if(confirm("¿Eliminar este gasto?")){data.expenses=data.expenses.filter(x=>x.id!==b.dataset.deleteExpense);save();toast("Gasto eliminado.");}
  });
  $("productSearch").addEventListener("input",renderProducts);
  $("dashboardPeriod").addEventListener("change",renderDashboard);
  $("reportFrom").addEventListener("change",renderReport);$("reportTo").addEventListener("change",renderReport);
  function csvEscape(v){return '"'+String(v??"").replace(/"/g,'""')+'"';}
  function downloadCsv(){
    const rows=[["Moneda ISO 4217",data.settings.currency],[],["Tipo","Fecha","Producto o concepto","Cantidad","Precio o monto","Costo unitario","Total"]];
    data.products.forEach(p=>rows.push(["Producto",p.createdAt,p.name,p.stock,p.price,productCost(p),""]));
    data.sales.forEach(s=>rows.push(["Venta",s.date,s.name,s.qty,s.price,s.cost,s.qty*s.price]));
    data.expenses.forEach(e=>rows.push(["Gasto",e.date,e.name,"",e.amount,"",e.amount]));
    data.stockMoves.forEach(m=>rows.push(["Inventario: "+m.typeLabel,m.date,m.name,m.qty,"","",""+m.reason]));
    const blob=new Blob(["\ufeff"+rows.map(r=>r.map(csvEscape).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mi-primer-negocio-36.csv";a.click();URL.revokeObjectURL(a.href);
  }
  $("exportCsv").addEventListener("click",downloadCsv);$("exportCsvTop").addEventListener("click",downloadCsv);
  $("generatePdf").addEventListener("click",()=>{
    if(!window.jspdf){toast("No se pudo cargar el generador PDF. Revisa tu conexión a internet.");return;}
    const {from,to}=reportRange(),t=totals(from,to),doc=new window.jspdf.jsPDF();
    doc.setFontSize(18);doc.text("Mi Primer Negocio 36",14,18);
    doc.setFontSize(11);doc.text(`Reporte de actividad · Moneda: ${data.settings.currency}`,14,27);doc.text(`Periodo: ${from||"Inicio"} al ${to||"Hoy"}`,14,34);
    const lines=[["Ventas totales",money(t.revenue)],["Costo de productos vendidos",money(t.costs)],["Utilidad bruta",money(t.gross)],["Gastos registrados",money(t.expenseTotal)],["Ganancia neta estimada",money(t.net)]];
    let y=47;lines.forEach(([a,b])=>{doc.text(a,14,y);doc.text(b,190,y,{align:"right"});y+=9;});
    y+=5;doc.setFontSize(13);doc.text("Resumen por producto",14,y);y+=8;doc.setFontSize(9);
    const groups={};t.ss.forEach(s=>{const g=groups[s.productId]||(groups[s.productId]={name:s.name,qty:0,revenue:0,cost:0});g.qty+=s.qty;g.revenue+=s.qty*s.price;g.cost+=s.qty*s.cost;});
    doc.text("Producto",14,y);doc.text("Unidades",105,y);doc.text("Ingresos",135,y);doc.text("Utilidad",190,y,{align:"right"});y+=7;
    Object.values(groups).forEach(g=>{if(y>275){doc.addPage();y=20;}doc.text(g.name.slice(0,42),14,y);doc.text(String(g.qty),105,y);doc.text(money(g.revenue),135,y);doc.text(money(g.revenue-g.cost),190,y,{align:"right"});y+=7;});
    doc.setFontSize(8);doc.text("Reporte estimado para control escolar. Verifica tus registros antes de tomar decisiones.",14,287);
    doc.save("reporte-mi-primer-negocio-36.pdf");
  });
  const currencySelect = $("currencySelect");
  if(currencySelect){
    currencySelect.value = data.settings.currency || "MXN";
    currencySelect.addEventListener("change",()=>{
      const chosen = currencySelect.value;
      if(!CURRENCY_LOCALES[chosen]){currencySelect.value=data.settings.currency||"MXN";toast("Moneda no válida.");return;}
      data.settings.currency=chosen;
      save();
      toast("Moneda actualizada a "+chosen+". No se realizó conversión de importes.");
    });
  }
  $("saleDate").value=today();$("expenseDate").value=today();$("reportFrom").value=addDays(today(),-29);$("reportTo").value=today();
  renderAll();
})();