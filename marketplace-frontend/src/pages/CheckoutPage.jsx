import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { clearCart, selectCartTotal } from '../features/cart/cartSlice';
import { paymentService, deliveryService } from '../services/services';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiTruck, FiCheckCircle, FiLock, FiCreditCard,
  FiShoppingBag, FiArrowRight, FiAlertTriangle,
} from 'react-icons/fi';
import './CheckoutPage.css';

const paypalOptions = {
  'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID || 'paypal_client_placeholder',
  currency: 'MAD',
  intent: 'capture',
};

const MOROCCAN_CITIES = [
  'Casablanca','Rabat','Salé','Marrakech','Fès','Tanger',
  'Agadir','Meknès','Oujda','Kénitra','Tétouan','El Jadida','Autre',
];

function ShippingStep({ form, setForm, onNext, shippingFee, estimated, loading }) {
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="checkout-card">
      <h2 className="checkout-section-title"><FiTruck className="checkout-icon" /> Adresse de livraison</h2>
      <div className="checkout-grid-2">
        <div className="form-group checkout-full">
          <label className="form-label">Nom complet *</label>
          <input className="form-input" value={form.fullName} onChange={e => upd('fullName', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Téléphone *</label>
          <input className="form-input" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+212 6XX-XXXXXX" />
        </div>
        <div className="form-group">
          <label className="form-label">Ville *</label>
          <select className="form-input" value={form.city} onChange={e => upd('city', e.target.value)}>
            {MOROCCAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group checkout-full">
          <label className="form-label">Adresse complète *</label>
          <input className="form-input" value={form.street} onChange={e => upd('street', e.target.value)} placeholder="Rue, quartier, numéro…" />
        </div>
        <div className="form-group">
          <label className="form-label">Code postal</label>
          <input className="form-input" value={form.postalCode} onChange={e => upd('postalCode', e.target.value)} />
        </div>
      </div>
      {estimated && (
        <div className="checkout-delivery-info">
          <FiTruck size={15} />
          Livraison estimée avant le <strong>{new Date(estimated).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</strong>
          &nbsp;· Frais : <strong>{formatPrice(shippingFee)}</strong>
        </div>
      )}
      <button className="btn btn-primary btn-lg w-full" style={{ marginTop: 8 }}
        disabled={loading || !form.fullName || !form.phone || !form.street} onClick={onNext}>
        {loading ? 'Préparation…' : <><span>Choisir le paiement</span> <FiArrowRight /></>}
      </button>
    </div>
  );
}

function PaymentMethodStep({ method, setMethod, onBack, onPayPal, onCOD, loadingCOD, loadingPayPal }) {
  return (
    <div className="checkout-card">
      <h2 className="checkout-section-title"><FiCreditCard className="checkout-icon" /> Mode de paiement</h2>
      <div className="payment-method-list">
        <label className={`payment-method-option ${method === 'paypal' ? 'active' : ''}`}>
          <input type="radio" value="paypal" checked={method === 'paypal'} onChange={() => setMethod('paypal')} />
          <div className="payment-method-body">
            <div className="payment-method-label">
              <FiCreditCard size={18} />
              <span>Paiement PayPal</span>
              <div className="payment-badges">
                <span className="card-badge paypal">PAYPAL</span>
              </div>
            </div>
            <p className="payment-method-desc">Paiement sécurisé via PayPal · SSL 256 bits</p>
          </div>
        </label>
        <label className={`payment-method-option ${method === 'cod' ? 'active' : ''}`}>
          <input type="radio" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')} />
          <div className="payment-method-body">
            <div className="payment-method-label"><FiShoppingBag size={18} /><span>Paiement à la livraison</span></div>
            <p className="payment-method-desc">Payez en espèces à la réception de votre colis</p>
          </div>
        </label>
      </div>
      <div className="checkout-actions">
        <button className="btn btn-outline" onClick={onBack}>← Retour</button>
        {method === 'paypal'
          ? <button className="btn btn-primary btn-lg" onClick={onPayPal} disabled={loadingPayPal}>
              {loadingPayPal ? <><span className="spinner" /> Préparation…</> : <><FiLock size={15} /> Payer via PayPal</>}
            </button>
          : <button className="btn btn-gold btn-lg" onClick={onCOD} disabled={loadingCOD}>
              {loadingCOD ? 'Traitement…' : 'Confirmer la commande'}
            </button>
        }
      </div>
    </div>
  );
}

function PayPalPaymentForm({ orderId, orderNumber, totalMAD, approvalUrl, onBack, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (approvalUrl) {
      // Redirect to PayPal for approval
      window.location.href = approvalUrl;
    }
  }, [approvalUrl]);

  return (
    <div className="checkout-card">
      <h2 className="checkout-section-title"><FiLock className="checkout-icon" /> Paiement PayPal</h2>
      <div className="paypal-amount-note">
        <p>Montant : <strong>{formatPrice(totalMAD)}</strong></p>
        <p className="paypal-currency-note">Paiement en <strong>MAD</strong> via PayPal</p>
      </div>
      <div className="paypal-redirect-notice">
        <p>Redirection vers PayPal en cours...</p>
        <div className="spinner" style={{ margin: '20px auto' }}></div>
      </div>
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          <FiAlertTriangle size={15} /> {errorMsg}
        </div>
      )}
      <div className="checkout-actions" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-outline" onClick={onBack} disabled={processing}>← Retour</button>
      </div>
      <p className="paypal-secure-note"><FiLock size={11} /> Données chiffrées par PayPal</p>
    </div>
  );
}

function SuccessScreen({ order, receiptUrl, isCOD }) {
  const navigate = useNavigate();
  return (
    <div className="checkout-success">
      <div className="success-icon"><FiCheckCircle size={40} /></div>
      <h1>{isCOD ? 'Commande confirmée !' : 'Paiement confirmé !'}</h1>
      <p className="success-order-num">Commande <strong>{order?.orderNumber}</strong></p>
      <p className="success-desc">
        {isCOD
          ? 'Votre commande a été passée avec succès. Vous serez contacté pour confirmer la livraison.'
          : 'Paiement accepté. Votre commande est confirmée et en cours de traitement.'}
      </p>
      <div className="success-actions">
        <button className="btn btn-primary" onClick={() => navigate('/account/orders')}>Voir mes commandes</button>
        {receiptUrl && <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn btn-outline">Télécharger le reçu</a>}
        <button className="btn btn-ghost" onClick={() => navigate('/products')}>Continuer mes achats</button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { items } = useSelector(s => s.cart);
  const { user }  = useSelector(s => s.auth);
  const subtotal  = useSelector(selectCartTotal);

  const [step, setStep]     = useState('address');
  const [method, setMethod] = useState('paypal');
  const [shippingFee, setFee]     = useState(35);
  const [estimated, setEstimated] = useState(null);
  const [pendingOrder, setPending] = useState(null);
  const [success, setSuccess]     = useState(null);
  const [receiptUrl, setReceipt]  = useState(null);
  const [isCOD, setIsCOD]         = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingCOD,  setLoadingCOD]  = useState(false);

  const [form, setForm] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', city: 'Casablanca',
    postalCode: user?.address?.postalCode || '', country: 'MA',
  });

  useEffect(() => {
    if (!items.length && step !== 'success') navigate('/cart');
  }, [items]);

  useEffect(() => {
    deliveryService.calculateFee({ city: form.city, weight: 500 })
      .then(r => { setFee(r.data.shippingFee); setEstimated(r.data.estimatedDeliveryDate); })
      .catch(() => {});
  }, [form.city]);

  const handleAddressNext = () => {
    if (!form.fullName || !form.phone || !form.street || !form.city) {
      toast.error('Veuillez remplir tous les champs obligatoires.'); return;
    }
    setStep('method');
  };

  const handleGoPayPal = async () => {
    setLoadingNext(true);
    try {
      const res = await paymentService.createPayment({
        items: items.map(i => ({ product: i.product, quantity: i.quantity })),
        shippingAddress: form,
      });
      setPending({
        orderId: res.data.orderId,
        orderNumber: res.data.orderNumber,
        pricing: res.data.pricing,
        approvalUrl: res.data.approvalUrl,
        paymentId: res.data.paymentId
      });
      setStep('paypal');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible d\'initialiser le paiement PayPal.');
    } finally { setLoadingNext(false); }
  };

  const handleCOD = async () => {
    setLoadingCOD(true);
    try {
      const { orderService } = await import('../services/services');
      const res = await orderService.create({
        items: items.map(i => ({ product: i.product, quantity: i.quantity })),
        shippingAddress: form,
      });
      dispatch(clearCart());
      setSuccess(res.data.order); setIsCOD(true); setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande.');
    } finally { setLoadingCOD(false); }
  };

  const handlePayPalSuccess = (order, url) => {
    dispatch(clearCart()); setSuccess(order); setReceipt(url); setStep('success');
  };

  const total = subtotal + shippingFee;

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0a0a0f', colorBackground: '#ffffff',
        colorText: '#0a0a0f', fontFamily: "'DM Sans', system-ui, sans-serif",
        borderRadius: '10px',
      },
    },
  };

  if (step === 'success') return (
    <div className="checkout-page page-enter">
      <div className="checkout-container">
        <SuccessScreen order={success} receiptUrl={receiptUrl} isCOD={isCOD} />
      </div>
    </div>
  );

  return (
    <div className="checkout-page page-enter">
      <div className="checkout-container">
        <div className="checkout-progress">
          {['address','method','paypal'].map((s, i) => {
            const labels = ['Livraison','Paiement','Confirmation'];
            const curIdx = ['address','method','paypal'].indexOf(step);
            return (
              <React.Fragment key={s}>
                <div className={`progress-step ${i === curIdx ? 'active' : ''} ${i < curIdx ? 'done' : ''}`}>
                  <div className="progress-dot">{i < curIdx ? '✓' : i + 1}</div>
                  <span>{labels[i]}</span>
                </div>
                {i < 2 && <div className={`progress-line ${i < curIdx ? 'done' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>
        <div className="checkout-layout">
          <div className="checkout-main">
            {step === 'address' && <ShippingStep form={form} setForm={setForm} onNext={handleAddressNext} shippingFee={shippingFee} estimated={estimated} loading={loadingNext} />}
            {step === 'method' && <PaymentMethodStep method={method} setMethod={setMethod} onBack={() => setStep('address')} onPayPal={handleGoPayPal} onCOD={handleCOD} loadingCOD={loadingCOD} loadingPayPal={loadingNext} />}
            {step === 'paypal' && pendingOrder && (
              <PayPalPaymentForm
                orderId={pendingOrder?.orderId} orderNumber={pendingOrder?.orderNumber}
                totalMAD={total} approvalUrl={pendingOrder?.approvalUrl}
                onBack={() => setStep('method')} onSuccess={handlePayPalSuccess}
              />
            )}
          </div>
          <aside className="checkout-summary">
            <div className="checkout-card">
              <h3 className="checkout-summary-title">Votre commande</h3>
              <div className="summary-items">
                {items.map(i => (
                  <div key={i.product} className="summary-item">
                    <div className="summary-item-img-wrap">
                      <img src={i.image} alt={i.name} />
                      <span className="summary-item-qty">{i.quantity}</span>
                    </div>
                    <p className="summary-item-name">{i.name}</p>
                    <p className="summary-item-price">{formatPrice(i.price * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="summary-totals">
                <div className="summary-row"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                <div className="summary-row"><span>Livraison</span><span>{formatPrice(shippingFee)}</span></div>
                <div className="summary-divider" />
                <div className="summary-row summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
                {method === 'paypal' && step === 'paypal' && (
                  <p className="summary-paypal-note">Paiement en MAD via PayPal</p>
                )}
              </div>
              <div className="summary-secure"><FiLock size={12} /><span>Commande sécurisée</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
