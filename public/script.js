const $ = id => document.getElementById(id);
let food = [];
let cart = [];
let submitting = false;

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
function notify(text, success = false) {
  $('message').className = `alert ${success ? 'alert-success' : 'alert-danger'}`;
  $('message').textContent = text;
}
function renderFood() {
  $('foodList').replaceChildren();
  food.forEach(({ id, name, price, category }) => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = '<article class="card food-card"><div class="card-body d-flex flex-column"><h3 class="h5"></h3><p class="text-muted category"></p><p class="fw-bold price"></p><button class="btn btn-outline-success mt-auto">Add to cart</button></div></article>';
    col.querySelector('h3').textContent = name;
    col.querySelector('.category').textContent = category;
    col.querySelector('.price').textContent = `Rs. ${price}`;
    col.querySelector('button').addEventListener('click', () => addItem(id));
    $('foodList').append(col);
  });
}
function addItem(id) {
  if (submitting) return;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    if (existing.quantity >= 99) return notify('Maximum quantity is 99 per item');
    existing.quantity++;
  } else {
    cart.push({ ...food.find(item => item.id === id), quantity: 1 });
  }
  renderCart();
}
function removeItem(id) {
  if (submitting) return;
  cart = cart.filter(item => item.id !== id);
  renderCart();
}
function renderCart() {
  $('cartList').replaceChildren();
  if (!cart.length) $('cartList').textContent = 'Cart is empty.';
  cart.forEach(({ id, name, price, quantity }) => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    const text = document.createElement('span');
    text.textContent = `${name} × ${quantity} — Rs. ${price * quantity}`;
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-danger';
    button.textContent = 'Remove';
    button.addEventListener('click', () => removeItem(id));
    row.append(text, button);
    $('cartList').append(row);
  });
  $('total').textContent = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
async function loadOrders() {
  const orders = await api('/orders');
  $('orderList').replaceChildren();
  orders.forEach(order => {
    const row = $('orderList').insertRow();
    [order.name, order.items.map(item => `${item.name} × ${item.quantity}`).join(', '), order.total].forEach(value => {
      row.insertCell().textContent = value;
    });
  });
}
$('orderForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  const name = $('name').value.trim();
  const phone = $('phone').value.trim();
  const address = $('address').value.trim();
  if (!name || !/^\d{11}$/.test(phone) || !address) return notify('Enter your name, 11-digit phone and address.');
  if (!cart.length) return notify('Add at least one item to your cart.');
  submitting = true;
  $('submitOrder').disabled = true;
  try {
    const order = await api('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, address, items: cart.map(({ id, quantity }) => ({ id, quantity })) })
    });
    cart = [];
    renderCart();
    event.target.reset();
    notify(`Order placed successfully! Total: Rs. ${order.total}`, true);
    try { await loadOrders(); } catch { notify('Order saved, but history could not be refreshed.'); }
  } catch (error) {
    notify(error.message);
  } finally {
    submitting = false;
    $('submitOrder').disabled = false;
  }
});
async function init() {
  try {
    food = await api('/food');
    renderFood();
    renderCart();
    await loadOrders();
  } catch (error) { notify(error.message); }
}
init();
