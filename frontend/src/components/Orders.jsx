import { useEffect, useState } from 'react'
import api, { errMessage } from '../api'

const money = (n) =>
  Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }])

  const loadAll = () => {
    setLoading(true)
    Promise.all([api.get('/orders'), api.get('/products'), api.get('/customers')])
      .then(([o, p, c]) => {
        setOrders(o.data)
        setProducts(p.data)
        setCustomers(c.data)
      })
      .catch((e) => setError(errMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const productById = (id) => products.find((p) => p.id === Number(id))

  const estimatedTotal = lines.reduce((sum, l) => {
    const p = productById(l.product_id)
    if (!p) return sum
    return sum + Number(p.price) * Number(l.quantity || 0)
  }, 0)

  const updateLine = (i, patch) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const addLine = () => setLines([...lines, { product_id: '', quantity: 1 }])
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i))

  const resetForm = () => {
    setCustomerId('')
    setLines([{ product_id: '', quantity: 1 }])
  }

  const submit = async () => {
    setError('')
    setSuccess('')
    if (!customerId) {
      setError('Please select a customer.')
      return
    }
    const items = lines
      .filter((l) => l.product_id && Number(l.quantity) > 0)
      .map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }))
    if (items.length === 0) {
      setError('Add at least one product with a quantity.')
      return
    }
    setSaving(true)
    try {
      const r = await api.post('/orders', { customer_id: Number(customerId), items })
      setSuccess(`Order #${r.data.id} placed — total ${money(r.data.total_amount)}.`)
      setShowForm(false)
      resetForm()
      loadAll() // refreshes orders AND product stock
    } catch (e) {
      // The backend returns a clear message on insufficient stock.
      setError(errMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const customerName = (id) => {
    const c = customers.find((x) => x.id === id)
    return c ? c.name : `Customer ${id}`
  }
  const productName = (id) => {
    const p = products.find((x) => x.id === id)
    return p ? `${p.name} (${p.sku})` : `Product ${id}`
  }

  return (
    <div>
      <div className="page-head">
        <h1>Orders</h1>
        <p>Place orders. Stock is checked and reduced automatically.</p>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}
      {success && <div className="alert success">✓ {success}</div>}

      <div className="toolbar">
        <span className="muted">{orders.length} order(s)</span>
        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true)
              setError('')
              setSuccess('')
            }}
          >
            + New order
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="section-title">
            <h2>Create order</h2>
          </div>

          {customers.length === 0 || products.length === 0 ? (
            <div className="alert error">
              You need at least one customer and one product before placing an order.
            </div>
          ) : (
            <>
              <div className="field" style={{ maxWidth: 340, marginBottom: 16 }}>
                <label>Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </option>
                  ))}
                </select>
              </div>

              <label className="field" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
                  Line items
                </span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lines.map((l, i) => {
                  const p = productById(l.product_id)
                  return (
                    <div className="line-item" key={i}>
                      <div className="field">
                        <select
                          value={l.product_id}
                          onChange={(e) => updateLine(i, { product_id: e.target.value })}
                        >
                          <option value="">Select product…</option>
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.id} disabled={pr.stock_quantity === 0}>
                              {pr.name} — {money(pr.price)}{' '}
                              {pr.stock_quantity === 0
                                ? '(out of stock)'
                                : `(${pr.stock_quantity} left)`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={l.quantity}
                          onChange={(e) => updateLine(i, { quantity: e.target.value })}
                        />
                      </div>
                      <button
                        className="remove"
                        title="Remove line"
                        onClick={() => removeLine(i)}
                        disabled={lines.length === 1}
                      >
                        ×
                      </button>
                      {p && Number(l.quantity) > p.stock_quantity && (
                        <div
                          style={{ gridColumn: '1 / -1', color: 'var(--red)', fontSize: 13, fontWeight: 600 }}
                        >
                          Only {p.stock_quantity} in stock for {p.name}.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button className="link-btn" style={{ marginTop: 12 }} onClick={addLine}>
                + Add another product
              </button>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  Estimated total: {money(estimatedTotal)}
                </div>
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={submit} disabled={saving}>
                    {saving ? 'Placing…' : 'Place order'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="card card-pad">
        <div className="section-title">
          <h2>Order history</h2>
        </div>
        {loading ? (
          <div className="spinner-line">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty">No orders yet.</div>
        ) : (
          orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="order-head">
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Order #{o.id}</div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {customerName(o.customer_id)} ·{' '}
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontWeight: 800, fontSize: 16 }}>
                    {money(o.total_amount)}
                  </div>
                  <span className="badge green">
                    <span className="dot" />
                    {o.status}
                  </span>
                </div>
              </div>
              <div className="order-items">
                {o.items.map((it) => (
                  <div className="row" key={it.id}>
                    <span>
                      {it.quantity} × {productName(it.product_id)}
                    </span>
                    <span className="mono">{money(Number(it.unit_price) * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
