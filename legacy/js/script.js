const menuData = [
  {id:1,name:'Cappuccino',sub:'with Chocolate',category:'cappuccino',price:4.00,rating:4.8,reviews:230,img:'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80',desc:'A classic cappuccino made with 25ml of rich espresso and 85ml of perfectly steamed milk, topped with chocolate shavings.'},
  {id:2,name:'Café Latte',sub:'with Oat Milk',category:'latte',price:3.90,rating:4.9,reviews:187,img:'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=80',desc:'A smooth, creamy latte made with oat milk for a naturally sweet finish. Perfect for your morning.'},
  {id:3,name:'Machiato',sub:'Caramel Drizzle',category:'machiato',price:4.50,rating:4.7,reviews:145,img:'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',desc:'Espresso marked with a dollop of foam, drizzled with house-made caramel. Bold yet sweet.'},
  {id:4,name:'Cold Brew',sub:'Double Strength',category:'cold',price:5.00,rating:4.9,reviews:312,img:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',desc:'Steeped for 18 hours in cold water for an incredibly smooth, low-acid coffee. Served over ice.'},
  {id:5,name:'Americano',sub:'Classic Black',category:'cappuccino',price:3.00,rating:4.6,reviews:98,img:'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80',desc:"A long espresso with hot water for a clean, bold black coffee. The purist's choice."},
  {id:6,name:'Mocha Latte',sub:'Dark Chocolate',category:'latte',price:4.80,rating:4.8,reviews:201,img:'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80',desc:'Espresso blended with rich dark chocolate and steamed milk. A dessert in a cup.'},
  {id:7,name:'Cold Latte',sub:'Vanilla Bean',category:'cold',price:4.50,rating:4.7,reviews:156,img:'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&q=80',desc:'Chilled espresso over ice with vanilla-infused cold milk. Sweet, simple, and satisfying.'},
  {id:8,name:'Almond Croissant',sub:'Fresh Baked',category:'snack',price:2.50,rating:4.8,reviews:88,img:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',desc:'Flaky, buttery croissant filled with almond cream and topped with toasted flaked almonds. Baked fresh daily.'},
];
let cart=[],currentItem=null,currentQty=1;

function renderMenu(items){
  const grid=document.getElementById('menu-grid'); grid.innerHTML='';
  items.forEach((item,i)=>{
    const card=document.createElement('div'); card.className='menu-card'; card.style.animationDelay=(i*0.07)+'s';
    card.innerHTML=`<img src="${item.img}" alt="${item.name}" class="menu-card-img"/>
      <div class="menu-card-body">
        <div class="menu-card-name">${item.name}</div>
        <div class="menu-card-desc">${item.sub}</div>
        <div class="menu-card-rating"><span style="color:var(--star)">★</span> ${item.rating} (${item.reviews})</div>
        <div class="menu-card-footer">
          <span class="menu-card-price">$ ${item.price.toFixed(2)}</span>
          <button class="add-btn" onclick="event.stopPropagation();addToCart(menuData[${menuData.indexOf(item)}]);showToast('${item.name} added!')">+</button>
        </div>
      </div>`;
    card.onclick=()=>openItem(item); grid.appendChild(card);
  });
}
function filterMenu(cat,btn){document.querySelectorAll('.category-tabs .tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');renderMenu(cat==='all'?menuData:menuData.filter(i=>i.category===cat));}
function openItem(item){currentItem=item;currentQty=1;document.getElementById('modal-img').src=item.img;document.getElementById('modal-name').textContent=item.name;document.getElementById('modal-sub').textContent=item.sub;document.getElementById('modal-price').textContent='$ '+item.price.toFixed(2);document.getElementById('modal-desc').textContent=item.desc;document.getElementById('modal-qty').textContent=1;document.getElementById('modal').classList.add('open');}
function closeModal(e){if(e.target===document.getElementById('modal'))document.getElementById('modal').classList.remove('open');}
function changeQty(d){currentQty=Math.max(1,currentQty+d);document.getElementById('modal-qty').textContent=currentQty;}
function addFromModal(){for(let i=0;i<currentQty;i++)addToCart(currentItem);document.getElementById('modal').classList.remove('open');showToast(`${currentItem.name} × ${currentQty} added!`);}
function addToCart(item){const e=cart.find(c=>c.id===item.id);if(e)e.qty++;else cart.push({...item,qty:1});updateCartBadge();}
function updateCartBadge(){const t=cart.reduce((s,i)=>s+i.qty,0);document.getElementById('cart-badge').textContent=t;const nc=document.getElementById('nav-cart-count');if(nc)nc.textContent=t>0?`(${t})`:'';} 
function openCart(){if(!cart.length){showToast('Your cart is empty!');return;}const total=cart.reduce((s,i)=>s+i.qty*i.price,0);alert(`🛒 Cart:\n${cart.map(i=>`${i.name} × ${i.qty} — $${(i.qty*i.price).toFixed(2)}`).join('\n')}\n\nTotal: $${total.toFixed(2)}`);}
function setSizeActive(btn){btn.closest('.size-selector').querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)';},2200);}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:0.1});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
renderMenu(menuData);
