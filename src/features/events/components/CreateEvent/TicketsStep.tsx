import { Ticket, Plus, Trash2 } from 'lucide-react';
import type { CreateEventData, TicketTier } from '../../types/event.types';

interface Props {
  data: CreateEventData;
  onUpdate: (data: Partial<CreateEventData>) => void;
}

export default function TicketsStep({ data, onUpdate }: Props) {
  const addTier = () => {
    const newTier: TicketTier = {
      id: crypto.randomUUID(),
      name: 'General Admission',
      price: 0,
      quantity: 100,
      sold: 0,
      available: 100,
      benefits: [],
      minPerOrder: 1,
      maxPerOrder: 10,
      visibility: 'public',
    };
    onUpdate({ ticketTiers: [...data.ticketTiers, newTier] });
  };

  const updateTier = (index: number, field: keyof TicketTier, value: any) => {
    const updatedTiers = [...data.ticketTiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    onUpdate({ ticketTiers: updatedTiers });
  };

  const removeTier = (index: number) => {
    onUpdate({ ticketTiers: data.ticketTiers.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div className="ce-step-title">
          <div className="ce-step-title-icon">
            <Ticket size={20} />
          </div>
          Tickets & Pricing
        </div>
        <button className="btn btn-outline" onClick={addTier}>
          <Plus size={16} />
          Add Tier
        </button>
      </div>
      <p className="ce-step-subtitle">Define your ticket types and pricing.</p>

      {data.ticketTiers.map((tier, index) => (
        <div key={tier.id} className="ce-ticket-card">
          <div className="ce-ticket-card-header">
            <span>Tier {index + 1}</span>
            <button className="ce-ticket-card-remove" onClick={() => removeTier(index)} title="Remove tier">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-row">
              <label className="label">Tier Name</label>
              <input
                className="input"
                type="text"
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label className="label">Price (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={tier.price}
                onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-row">
              <label className="label">Quantity</label>
              <input
                className="input"
                type="number"
                min="1"
                value={tier.quantity}
                onChange={(e) => updateTier(index, 'quantity', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="form-grid form-grid-3">
            <div className="form-row">
              <label className="label">Min per Order</label>
              <input
                className="input"
                type="number"
                min="1"
                value={tier.minPerOrder}
                onChange={(e) => updateTier(index, 'minPerOrder', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="form-row">
              <label className="label">Max per Order</label>
              <input
                className="input"
                type="number"
                min="1"
                value={tier.maxPerOrder}
                onChange={(e) => updateTier(index, 'maxPerOrder', parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="form-row">
              <label className="label">Visibility</label>
              <select
                className="select"
                value={tier.visibility}
                onChange={(e) => updateTier(index, 'visibility', e.target.value)}
              >
                <option value="public">Public</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="label">Description (Optional)</label>
            <input
              className="input input-sm"
              type="text"
              placeholder="What does this tier include?"
              value={tier.description || ''}
              onChange={(e) => updateTier(index, 'description', e.target.value)}
            />
          </div>
        </div>
      ))}

      {data.ticketTiers.length === 0 && (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No ticket tiers created. Click "Add Tier" to get started.
        </div>
      )}
    </div>
  );
}
