import { useEffect, useState } from 'react'
import api, { errMessage } from './api'
import Products from './components/Products'
import Customers from './components/Customers'
import Orders from './components/Orders'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'orders', label: 'Orders' },
]

function Dashboard() {
  const [data, setData] = useState({ products: [], customers: [], orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      api.get('/products'),
      api.get('/customers'),
      api.get('/orders'),
    ])
      .then(([p, c, o]) => {
        if (!active) return
        setData({ products: p.data, customers: c.data, orders: o.data })
      })
      .catch((e) => active && setError(errMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading) return <div className="spinner-line">Loading dashboard…</div>
  if (error)
    return (
      <div className="alert error">
        ⚠ {error}. Is the backend running at {api.defaults.baseURL}?
      </div>
    )

  const { products, customers, orders } = data
  const stockValue = products.reduce(
    (s, p) => s + Number(p.price) * p.stock_quantity,
    0,
  )
  const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length
  const revenue = orders.reduce((s, o) => s + Number(o.total_amount), 0)

  const money = (n) =>
    n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  return (
    <div>
      <div className="page-head">
        <h1>Overview</h1>
        <p>A snapshot of your inventory, customers, and orders.</p>
      </div>

      <div className="stats">
        <div className="stat accent">
          <div className="label">Total Revenue</div>
          <div className="value">{money(revenue)}</div>
          <div className="sub">{orders.length} orders placed</div>
        </div>
        <div className="stat">
          <div className="label">Products</div>
          <div className="value">{products.length}</div>
          <div className="sub">{outOfStock} out of stock</div>
        </div>
        <div className="stat">
          <div className="label">Inventory Value</div>
          <div className="value">{money(stockValue)}</div>
          <div className="sub">{lowStock} low on stock (≤5)</div>
        </div>
        <div className="stat">
          <div className="label">Customers</div>
          <div className="value">{customers.length}</div>
          <div className="sub">registered</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">
          <h2>Recent orders</h2>
        </div>
        {orders.length === 0 ? (
          <div className="empty">No orders yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => {
                  const cust = customers.find((c) => c.id === o.customer_id)
                  const qty = o.items.reduce((s, i) => s + i.quantity, 0)
                  return (
                    <tr key={o.id}>
                      <td className="mono">#{o.id}</td>
                      <td>{cust ? cust.name : `Customer ${o.customer_id}`}</td>
                      <td className="muted">{qty} item(s)</td>
                      <td className="mono">{money(Number(o.total_amount))}</td>
                      <td>
                        <span className="badge green">
                          <span className="dot" />
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">📦</span>
            Inventory&nbsp;&amp;&nbsp;Orders
          </div>
          <nav className="nav">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? 'active' : ''}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'products' && <Products />}
        {tab === 'customers' && <Customers />}
        {tab === 'orders' && <Orders />}
      </main>
    </div>
  )
}
