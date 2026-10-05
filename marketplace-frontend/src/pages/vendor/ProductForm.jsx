import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService, aiService } from '../../services/services';
import { fetchCategories } from '../../features/products/productSlice';
import { useDispatch, useSelector } from 'react-redux';
import { PageHeader } from '../../components/common';
import { primaryImage } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiZap, FiUpload, FiX, FiSave, FiArrowLeft } from 'react-icons/fi';

export default function ProductForm() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const isEdit    = !!id;
  const { categories } = useSelector(s => s.products);

  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '',
    category: '', tags: '', compareAtPrice: '',
    seoTitle: '', seoDescription: '',
  });
  const [images, setImages]       = useState([]);
  const [existing, setExisting]   = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPanel, setAiPanel]     = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    if (isEdit) {
      productService.getOne(id).then(r => {
        const p = r.data.product;
        setForm({
          name: p.name, description: p.description, price: p.price,
          stock: p.stock, category: p.category?._id || '',
          tags: p.tags?.join(', ') || '', compareAtPrice: p.compareAtPrice || '',
          seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '',
        });
        setExisting(p.images || []);
      }).catch(() => toast.error('Produit introuvable'));
    }
  }, [id]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNew = (i) => {
    setImages(prev => prev.filter((_, j) => j !== i));
    setPreviews(prev => prev.filter((_, j) => j !== i));
  };

  const removeExisting = async (imgId) => {
    try {
      await productService.deleteImage(id, imgId);
      setExisting(prev => prev.filter(img => img._id !== imgId));
      toast.success('Image supprimée');
    } catch { toast.error('Erreur'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      images.forEach(f => fd.append('images', f));

      if (isEdit) {
        await productService.update(id, fd);
        toast.success('Produit mis à jour !');
      } else {
        await productService.create(fd);
        toast.success('Produit créé !');
      }
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally { setLoading(false); }
  };

  // AI: generate description
  const generateDescription = async () => {
    if (!form.name) { toast.error('Entrez d\'abord le nom du produit'); return; }
    setAiLoading(true);
    try {
      const r = await aiService.generateDescription({
        productName: form.name,
        category: categories.find(c => c._id === form.category)?.name || '',
        language: 'FR',
      });
      upd('description', r.data.description);
      toast.success('Description générée par IA ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur IA');
    } finally { setAiLoading(false); }
  };

  const generateSEO = async () => {
    if (!form.name) { toast.error('Entrez d\'abord le nom du produit'); return; }
    setAiLoading(true);
    try {
      const r = await aiService.generateSEO({ productName: form.name, description: form.description });
      upd('seoTitle', r.data.seo.seoTitle);
      upd('seoDescription', r.data.seo.seoDescription);
      toast.success('SEO généré par IA ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur IA');
    } finally { setAiLoading(false); }
  };

  const suggestPrice = async () => {
    if (!form.name) { toast.error('Entrez d\'abord le nom du produit'); return; }
    setAiLoading(true);
    try {
      const r = await aiService.suggestPrice({
        productName: form.name,
        category: categories.find(c => c._id === form.category)?.name || '',
        currentPrice: form.price,
      });
      const { suggestedPrice, reasoning } = r.data.pricing;
      upd('price', suggestedPrice);
      toast.success(`Prix suggéré: ${suggestedPrice} MAD — ${reasoning}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur IA');
    } finally { setAiLoading(false); }
  };

  const Section = ({ title, children, extra }) => (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <PageHeader
        label={isEdit ? 'Modifier' : 'Créer'}
        title={isEdit ? 'Modifier le produit' : 'Nouveau produit'}
        action={
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendor/products')}>
            <FiArrowLeft size={14} /> Retour
          </button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div>
            <Section title="Informations principales"
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-sm" disabled={aiLoading}
                    style={{ background: 'linear-gradient(135deg,#8e44ad,#6c3483)', color: '#fff', gap: 6 }}
                    onClick={generateDescription}>
                    <FiZap size={13} /> {aiLoading ? '…' : 'Générer description'}
                  </button>
                </div>
              }>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Nom du produit *</label>
                  <input className="form-input" value={form.name} onChange={e => upd('name', e.target.value)} required placeholder="Ex: Tajine en Poterie de Safi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={6} value={form.description} onChange={e => upd('description', e.target.value)} required placeholder="Décrivez votre produit en détail…" style={{ minHeight: 140 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (séparés par des virgules)</label>
                  <input className="form-input" value={form.tags} onChange={e => upd('tags', e.target.value)} placeholder="artisanat, poterie, safi, maroc" />
                </div>
              </div>
            </Section>

            {/* SEO */}
            <Section title="Référencement SEO"
              extra={
                <button type="button" className="btn btn-sm" disabled={aiLoading}
                  style={{ background: 'linear-gradient(135deg,#8e44ad,#6c3483)', color: '#fff' }}
                  onClick={generateSEO}>
                  <FiZap size={13} /> {aiLoading ? '…' : 'Générer SEO'}
                </button>
              }>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Titre SEO <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(max 60 car.)</span></label>
                  <input className="form-input" value={form.seoTitle} onChange={e => upd('seoTitle', e.target.value)} maxLength={60} />
                  <span className="form-hint">{form.seoTitle.length}/60 caractères</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Méta description <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(max 155 car.)</span></label>
                  <textarea className="form-input" rows={3} value={form.seoDescription} onChange={e => upd('seoDescription', e.target.value)} maxLength={155} />
                  <span className="form-hint">{form.seoDescription.length}/155 caractères</span>
                </div>
              </div>
            </Section>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Submit */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <button type="submit" className="btn btn-gold w-full btn-lg" disabled={loading}>
                <FiSave size={16} /> {loading ? 'Sauvegarde…' : isEdit ? 'Mettre à jour' : 'Publier le produit'}
              </button>
            </div>

            {/* Price & Stock */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Prix & Stock</h3>
                <button type="button" className="btn btn-sm" disabled={aiLoading}
                  style={{ background: 'linear-gradient(135deg,#8e44ad,#6c3483)', color: '#fff' }}
                  onClick={suggestPrice}>
                  <FiZap size={12} /> Prix IA
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Prix (MAD) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => upd('price', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix barré (MAD)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={e => upd('compareAtPrice', e.target.value)} />
                  <span className="form-hint">Affiché barré si supérieur au prix</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input className="form-input" type="number" min="0" value={form.stock} onChange={e => upd('stock', e.target.value)} required />
                </div>
              </div>
            </div>

            {/* Category */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 14 }}>Catégorie</h3>
              <select className="form-input w-full" value={form.category} onChange={e => upd('category', e.target.value)} required>
                <option value="">Sélectionner…</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            {/* Images */}
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 14 }}>
                Images <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(max 5)</span>
              </h3>

              {/* Existing images */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: existing.length || previews.length ? 12 : 0 }}>
                {existing.map(img => (
                  <div key={img._id} style={{ position: 'relative', aspectRatio: 1, borderRadius: 10, overflow: 'hidden' }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isEdit && (
                      <button type="button" onClick={() => removeExisting(img._id)}
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(10,10,15,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiX size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {previews.map((url, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: 1, borderRadius: 10, overflow: 'hidden' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeNew(i)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(10,10,15,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {(existing.length + images.length) < 5 && (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px dashed var(--surface-3)', borderRadius: 10, padding: '20px 16px', cursor: 'pointer', transition: 'var(--transition)' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--surface-3)'}>
                  <FiUpload size={20} color="var(--ink-muted)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', textAlign: 'center' }}>Cliquer pour ajouter<br /><small>JPG, PNG, WebP · max 5 Mo</small></span>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>
        </div>
      </form>
      <style>{`@media(max-width:900px){form > div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
