const KEY="mipn36-data-v1";
const money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(n)||0);
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.products&&x.expenses&&x.sales)return x}catch(e){}return{products:[],expenses:[{id:uid(),name:"Internet",amount:100},{id:uid(),name:"Transporte",amount:150},{id:uid(),name:"Bolsas",amount:80}],sales:[]}}
let data=load();
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cost=p=>Number(p.materials)+Number(p.labor);
const sums=()=>({sales:data.sales.reduce((a,s)=>a+s.qty*s.price,0),profit:data.sales.reduce((a,s)=>a+s.qty*s.unitProfit,0),expenses:data.expenses.reduce((a,x)=>a+Number(x.amount),0)});
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function render(){
 $("#products-table").innerHTML=data.products.map(p=>`<tr><td>${esc(p.name)}</td><td>${money(p.materials)}</td><td>${money(p.labor)}</td><td>${money(cost(p))}</td><td>${money(p.price)}</td><td>${money(p.price-cost(p))}</td><td><button class="delete" data-p="${p.id}">Eliminar</button></td></tr>`).join("");
 $("#products-empty").style.display=data.products.length?"none":"block";
 const sel=$("#sale-product"),old=sel.value;sel.innerHTML=data.products.length?'<option value="">Selecciona un producto</option>'+data.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join(""):'<option value="">Primero agrega un producto</option>';if(data.products.some(p=>p.id===old))sel.value=old;
 $("#expenses-table").innerHTML=data.expenses.map(x=>`<tr><td>${esc(x.name)}</td><td>${money(x.amount)}</td><td><button class="delete" data-e="${x.id}">Eliminar</button></td></tr>`).join("");$("#expenses-empty").style.display=data.expenses.length?"none":"block";
 $("#sales-table").innerHTML=[...data.sales].reverse().map(s=>`<tr><td>${esc(s.date)}</td><td>${esc(s.name)}</td><td>${s.qty}</td><td>${money(s.price)}</td><td>${money(s.qty*s.price)}</td><td>${money(s.qty*s.unitProfit)}</td><td><button class="delete" data-s="${s.id}">Eliminar</button></td></tr>`).join("");$("#sales-empty").style.display=data.sales.length?"none":"block";
 const t=sums(),net=t.profit-t.expenses;
 $("#stat-sales").textContent=money(t.sales);$("#stat-net").textContent=money(net);$("#stat-products").textContent=data.products.length;$("#stat-count").textContent=data.sales.length;$("#expense-total").textContent=money(t.expenses);
 $("#report-sales").textContent=money(t.sales);$("#report-profit").textContent=money(t.profit);$("#report-expenses").textContent=money(t.expenses);$("#report-net").textContent=money(net);
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id==="panel-"+b.dataset.tab))}));
$("#product-form").addEventListener("submit",e=>{e.preventDefault();data.products.push({id:uid(),name:$("#product-name").value.trim(),materials:+$("#product-materials").value,labor:+$("#product-labor").value,price:+$("#product-price").value});e.target.reset();save()});
$("#expense-form").addEventListener("submit",e=>{e.preventDefault();data.expenses.push({id:uid(),name:$("#expense-name").value.trim(),amount:+$("#expense-amount").value});e.target.reset();save()});
$("#sale-product").addEventListener("change",()=>{const p=data.products.find(p=>p.id===$("#sale-product").value);if(p)$("#sale-price").value=p.price});
$("#sale-form").addEventListener("submit",e=>{e.preventDefault();const p=data.products.find(p=>p.id===$("#sale-product").value);if(!p){alert("Primero agrega un producto.");return}const price=+$("#sale-price").value,qty=+$("#sale-quantity").value;data.sales.push({id:uid(),date:$("#sale-date").value,name:p.name,productId:p.id,qty,price,unitProfit:price-cost(p)});e.target.reset();$("#sale-date").value=today();$("#sale-quantity").value=1;save()});
document.addEventListener("click",e=>{const b=e.target;if(b.dataset.p&&confirm("¿Eliminar este producto?"))data.products=data.products.filter(x=>x.id!==b.dataset.p);else if(b.dataset.e&&confirm("¿Eliminar este gasto?"))data.expenses=data.expenses.filter(x=>x.id!==b.dataset.e);else if(b.dataset.s&&confirm("¿Eliminar esta venta?"))data.sales=data.sales.filter(x=>x.id!==b.dataset.s);else return;save()});
$("#export-csv").addEventListener("click",()=>{const t=sums(),rows=[["Indicador","Monto MXN"],["Ventas totales",t.sales],["Utilidad bruta",t.profit],["Gastos fijos",t.expenses],["Ganancia neta estimada",t.profit-t.expenses],[],["Gasto","Monto"],...data.expenses.map(x=>[x.name,x.amount]),[],["Fecha","Producto","Cantidad","Precio unitario","Total venta","Utilidad"],...data.sales.map(s=>[s.date,s.name,s.qty,s.price,s.qty*s.price,s.qty*s.unitProfit])];const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="mi-primer-negocio-36.csv";a.click();URL.revokeObjectURL(a.href)});
$("#reset-data").addEventListener("click",()=>{if(confirm("Se borrarán todos los productos, gastos y ventas de este navegador. ¿Continuar?")){data={products:[],expenses:[],sales:[]};save()}});
$("#sale-date").value=today();render();