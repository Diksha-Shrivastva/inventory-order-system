import { useEffect, useState } from 'react'
import api, { errMessage } from '../api'

const EMPTY = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
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
      .get('/customers')
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

  const openEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' })
    setEditingId(c.id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const submit = async () => {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const base = {
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
      }
      if (editingId) {
        await api.put(`/customers/${editingId}`, base)
        setSuccess('Customer updated.')
      } else {
        await api.post('/customers', { ...base, email: form.email })
        setSuccess('Customer created.')
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

  const remove = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return
    try {
      await api.delete(`/customers/${c.id}`)
      setSuccess('Customer deleted.')
      load()
    } catch (e) {
      setError(errMessage(e))
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Customers</h1>
        <p>Manage customer records. Each customer needs a unique email.</p>
      </div>

      {error && <div className="alert error">⚠ {error}</div>}
      {success && <div className="alert success">✓ {success}</div>}

      <div className="toolbar">
        <span className="muted">{items.length} customer(s)</span>
        {!showForm && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Add customer
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="section-title">
            <h2>{editingId ? 'Edit customer' : 'New customer'}</h2>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input
                value={form.name}
                placeholder="Asha Verma"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email (unique)</label>
              <input
                type="email"
                value={form.email}
                disabled={!!editingId}
                placeholder="asha@example.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone (optional)</label>
              <input
                value={form.phone}
                placeholder="+91 90000 00000"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Address (optional)</label>
              <input
                value={form.address}
                placeholder="Delhi, IN"
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create customer'}
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
          <div className="empty">No customers yet. Add your first one above.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="muted">{c.email}</td>
                    <td className="muted">{c.phone || '—'}</td>
                    <td className="muted">{c.address || '—'}</td>
                    <td>
                      <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>
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
