import { useEffect, useState } from 'react'
import api, { errMessage } from '../api'

const EMPTY = { sku: '', name: '', description: '', price: '', stock_quantity: '' }

function stockBadge(qty) {
  if (qty === 0) return <span className="badge red"><span className="dot" />Out of stock</span>
  if (qty <= 5) return <span className="badge amber"><span className="dot" />Low ({qty})</span>
  return <span className="badge green"><span className="dot" />{qty} in stock</span>
}

export default function Products() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .get('/products')
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMessage(e)))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setForm(EMPTY)
    setEditingId(null)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (p) => {
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      price: p.price,
      stock_quantity: p.stock_quantity,
    })
    setEditingId(p.id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const submit = async () => {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
      }
      if (editingId) {
        await api.put(`/products/${editingId}`, payload)
        setSuccess('Product updated.')
      } else {
        await api.post('/products', { ...payload, sku: form.sku })
        setSuccess('Product created.')
      }
      setShowForm(false)
      setForm(EMPTY)
      setEditingId(null)
      load()
    } catch (e) {
      setError(errMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return
    try {
      await api.delete(`/products/${p.id}`)
      setSuccess('Product deleted.')
      load()
    } catch (e) {
      setError(errMessage(e))
    }
  }

  const money = (n) =>
    Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' })

  return (
    <div>
      <div className="page-head">
        <h1>Products</h1>
        <p>Manage your catalog. Each product needs a unique SKU.</p>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}
      {success && <div className="alert success">✓ {success}</div>}

      <div className="toolbar">
        <span className="muted">{items.length} product(s)</span>
        {!showForm && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Add product
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="section-title">
            <h2>{editingId ? 'Edit product' : 'New product'}</h2>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>SKU (unique)</label>
              <input
                value={form.sku}
                disabled={!!editingId}
                placeholder="SKU-001"
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Name</label>
              <input
                value={form.name}
                placeholder="Wireless Mouse"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                placeholder="19.99"
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Stock quantity</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock_quantity}
                placeholder="50"
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="spinner-line" style={{ padding: 20 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">No products yet. Add your first one above.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="mono"><span className="badge blue">{p.sku}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && (
                        <div className="muted" style={{ fontSize: 13 }}>{p.description}</div>
                      )}
                    </td>
                    <td className="mono">{money(p.price)}</td>
                    <td>{stockBadge(p.stock_quantity)}</td>
                    <td>
                      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
