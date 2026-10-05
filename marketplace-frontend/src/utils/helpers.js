// Format price in MAD
export const formatPrice = (amount) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(amount);

// Format date
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', ...options }).format(new Date(date));
};

// Truncate text
export const truncate = (text, max = 80) =>
  text?.length > max ? text.slice(0, max) + '…' : text;

// Status badge class
export const statusClass = (status) => ({
  pending:   'badge-pending',
  confirmed: 'badge-confirmed',
  preparing: 'badge-preparing',
  shipped:   'badge-shipped',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled',
}[status] || 'badge-pending');

// Status label in French
export const statusLabel = (status) => ({
  pending:   'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  pending_approval: 'En attente d\'approbation',
  approved:  'Approuvé',
}[status] || status);

// Delivery status label
export const deliveryStatusLabel = (status) => ({
  pending:           'En attente',
  picked_up:         'Récupéré',
  in_transit:        'En transit',
  out_for_delivery:  'En cours de livraison',
  delivered:         'Livré',
  failed:            'Échec de livraison',
  returned:          'Retourné',
}[status] || status);

// Get primary image URL
export const primaryImage = (images, fallback = 'https://via.placeholder.com/400x400?text=No+Image') => {
  if (!images?.length) return fallback;
  const primary = images.find(i => i.isPrimary);
  return (primary || images[0])?.url || fallback;
};

// Build query string
export const buildQuery = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

// Star array for rating
export const starsArray = (rating) => {
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(rating)) return 'full';
    if (i < rating) return 'half';
    return 'empty';
  });
};

// Role label
export const roleLabel = (role) => ({ buyer: 'Acheteur', vendor: 'Vendeur', admin: 'Administrateur' }[role] || role);
