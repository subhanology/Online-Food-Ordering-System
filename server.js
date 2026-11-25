import http from 'node:http';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const foodFile = new URL('./data/food.json', import.meta.url);
const ordersFile = new URL('./data/orders.json', import.meta.url);
const tempFile = new URL('./data/orders.tmp', import.meta.url);
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};
const staticFiles = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/style.css': ['style.css', 'text/css'],
  '/script.js': ['script.js', 'text/javascript']
};
let writeQueue = Promise.resolve();
function saveOrder(order) {
  const task = writeQueue.then(async () => {
    const orders = await readJSON(ordersFile);
    orders.push(order);
    await writeFile(tempFile, JSON.stringify(orders, null, 2));
    await rename(tempFile, ordersFile);
  });
  writeQueue = task.catch(() => {});
  return task;
}
async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 100000) throw new Error('Request too large');
  }
  return JSON.parse(body);
}
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  try {
    if (req.method === 'GET' && path === '/food') {
      return send(res, 200, await readJSON(foodFile));
    }
    if (req.method === 'GET' && path === '/orders') {
      return send(res, 200, await readJSON(ordersFile));
    }
    if (req.method === 'POST' && path === '/orders') {
      let body;
      try { body = await readBody(req); }
      catch { return send(res, 400, { message: 'Invalid JSON or request too large' }); }
      const { name, phone, address, items } = body ?? {};
      if (typeof name !== 'string' || !name.trim() ||
          typeof phone !== 'string' || !/^\d{11}$/.test(phone.trim()) ||
          typeof address !== 'string' || !address.trim() ||
          !Array.isArray(items) || !items.length) {
        return send(res, 400, { message: 'Enter name, 11-digit phone, address and cart items' });
      }
      const food = await readJSON(foodFile);
      const quantities = new Map();
      for (const item of items) {
        if (!item || !Number.isInteger(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || !food.some(f => f.id === item.id)) {
          return send(res, 400, { message: 'Invalid food ID or quantity' });
        }
        const quantity = (quantities.get(item.id) || 0) + item.quantity;
        if (quantity > 99) return send(res, 400, { message: 'Maximum quantity is 99 per item' });
        quantities.set(item.id, quantity);
      }
      const orderItems = [...quantities].map(([id, quantity]) => {
        const { name, price } = food.find(f => f.id === id);
        return { id, name, price, quantity, subtotal: price * quantity };
      });
      const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const order = { id: randomUUID(), name: name.trim(), phone: phone.trim(), address: address.trim(), items: orderItems, total, createdAt: new Date().toISOString() };
      await saveOrder(order);
      return send(res, 201, order);
    }
    if (req.method === 'GET' && Object.hasOwn(staticFiles, path)) {
      const [file, type] = staticFiles[path];
      const content = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
      return res.end(content);
    }
    if (path === '/food' || path === '/orders') {
      res.setHeader('Allow', path === '/food' ? 'GET' : 'GET, POST');
      return send(res, 405, { message: 'Method not allowed' });
    }
    return send(res, 404, { message: 'Route not found' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { message: 'Internal server error' });
  }
});
server.listen(3001, '127.0.0.1', () => console.log('Food ordering server: http://localhost:3001'));
