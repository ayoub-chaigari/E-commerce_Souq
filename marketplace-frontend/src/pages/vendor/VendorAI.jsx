import React, { useState } from 'react';
import { aiService } from '../../services/services';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';
import { FiZap, FiCopy, FiCheck, FiGlobe, FiSearch, FiDollarSign, FiEdit3 } from 'react-icons/fi';

const TOOLS = [
  { id: 'description', label: 'Description', icon: FiEdit3,    color: '#8e44ad', desc: 'Générer une description percutante pour un produit' },
  { id: 'multilingual', label: 'Multilingue', icon: FiGlobe,   color: '#2563eb', desc: 'Générer en français, anglais et arabe simultanément' },
  { id: 'seo',         label: 'SEO',          icon: FiSearch,  color: '#065f46', desc: 'Titre, méta description et mots-clés optimisés' },
  { id: 'price',       label: 'Prix',         icon: FiDollarSign, color: '#92400e', desc: 'Suggestion de prix basée sur le marché marocain' },
  { id: 'improve',     label: 'Amélioration', icon: FiZap,     color: '#c0392b', desc: 'Réécrire et améliorer un texte existant' },
];

export default function VendorAI() {
  const [tool, setTool]     = useState('description');
  const [loading, setLoad]  = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');

  const [form, setForm] = useState({
    productName: '', category: '', features: '',
    language: 'FR', text: '', tone: 'professional', currentPrice: '',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
    toast.success('Copié !');
  };

  const handleGenerate = async () => {
    if (!form.productName && tool !== 'improve') { toast.error('Entrez le nom du produit'); return; }
    if (tool === 'improve' && !form.text) { toast.error('Entrez le texte à améliorer'); return; }
    setLoad(true); setResult(null);
    try {
      let r;
      switch (tool) {
        case 'description':
          r = await aiService.generateDescription({ productName: form.productName, category: form.category, features: form.features, language: form.language });
          setResult({ type: 'text', content: r.data.description }); break;
        case 'multilingual':
          r = await aiService.generateMultilingual({ productName: form.productName, category: form.category, features: form.features });
          setResult({ type: 'multilingual', content: r.data.descriptions }); break;
        case 'seo':
          r = await aiService.generateSEO({ productName: form.productName, category: form.category, description: form.features });
          setResult({ type: 'seo', content: r.data.seo }); break;
        case 'price':
          r = await aiService.suggestPrice({ productName: form.productName, category: form.category, features: form.features, currentPrice: form.currentPrice });
          setResult({ type: 'price', content: r.data.pricing }); break;
        case 'improve':
          r = await aiService.improveText({ text: form.text, language: form.language, tone: form.tone });
          setResult({ type: 'text', content: r.data.improvedText }); break;
        default: break;
      }
      toast.success('Génération réussie ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la génération IA');
    } finally { setLoad(false); }
  };

  const activeTool = TOOLS.find(t => t.id === tool);

  return (
    <div>
      <PageHeader label="Intelligence Artificielle" title="Assistant IA"
        subtitle="Boostez vos fiches produits grâce à l'IA" />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Tool selector */}
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => { setTool(t.id); setResult(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, transition: 'var(--transition)',
                background: tool === t.id ? `${t.color}14` : 'transparent',
                color: tool === t.id ? t.color : 'var(--ink-muted)',
                border: tool === t.id ? `1.5px solid ${t.color}30` : '1.5px solid transparent',
              }}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Main panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tool header */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeTool.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTool.color }}>
                <activeTool.icon size={20} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{activeTool.label}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{activeTool.desc}</p>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tool !== 'improve' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Nom du produit *</label>
                      <input className="form-input" placeholder="Tajine en Poterie de Safi" value={form.productName} onChange={e => upd('productName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Catégorie</label>
                      <input className="form-input" placeholder="Artisanat" value={form.category} onChange={e => upd('category', e.target.value)} />
                    </div>
                  </div>
                  {tool !== 'price' && (
                    <div className="form-group">
                      <label className="form-label">Caractéristiques / Points forts</label>
                      <textarea className="form-input" rows={3} placeholder="Fait main, argile naturelle, diam. 30cm, idéal pour 4 personnes…" value={form.features} onChange={e => upd('features', e.target.value)} />
                    </div>
                  )}
                  {tool === 'price' && (
                    <div className="form-group">
                      <label className="form-label">Prix actuel (MAD) — optionnel</label>
                      <input className="form-input" type="number" placeholder="180" value={form.currentPrice} onChange={e => upd('currentPrice', e.target.value)} />
                    </div>
                  )}
                </>
              )}

              {tool === 'improve' && (
                <div className="form-group">
                  <label className="form-label">Texte à améliorer *</label>
                  <textarea className="form-input" rows={5} placeholder="Collez ici le texte que vous souhaitez améliorer…" value={form.text} onChange={e => upd('text', e.target.value)} />
                </div>
              )}

              {(tool === 'description' || tool === 'improve') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {tool === 'description' && (
                    <div className="form-group">
                      <label className="form-label">Langue</label>
                      <select className="form-input" value={form.language} onChange={e => upd('language', e.target.value)}>
                        <option value="FR">Français</option>
                        <option value="EN">English</option>
                        <option value="AR">العربية</option>
                      </select>
                    </div>
                  )}
                  {tool === 'improve' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Langue</label>
                        <select className="form-input" value={form.language} onChange={e => upd('language', e.target.value)}>
                          <option value="FR">Français</option>
                          <option value="EN">English</option>
                          <option value="AR">العربية</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Ton</label>
                        <select className="form-input" value={form.tone} onChange={e => upd('tone', e.target.value)}>
                          <option value="professional">Professionnel</option>
                          <option value="casual">Décontracté</option>
                          <option value="luxury">Luxe</option>
                          <option value="enthusiastic">Enthousiaste</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button className="btn btn-lg w-full" disabled={loading}
                style={{ background: `linear-gradient(135deg, ${activeTool.color}, ${activeTool.color}cc)`, color: '#fff', justifyContent: 'center' }}
                onClick={handleGenerate}>
                {loading
                  ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Génération en cours…</>
                  : <><FiZap size={18} /> Générer avec l'IA</>}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiZap size={16} color="var(--gold)" /> Résultat
              </h3>

              {result.type === 'text' && (
                <div style={{ position: 'relative' }}>
                  <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 18, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--ink)' }}>
                    {result.content}
                  </div>
                  <button onClick={() => copy(result.content, 'main')}
                    style={{ position: 'absolute', top: 12, right: 12, padding: '6px 12px', borderRadius: 8, background: copied === 'main' ? 'var(--emerald)' : 'var(--white)', color: copied === 'main' ? '#fff' : 'var(--ink-muted)', border: '1px solid var(--surface-3)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {copied === 'main' ? <FiCheck size={13} /> : <FiCopy size={13} />} {copied === 'main' ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              )}

              {result.type === 'multilingual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.entries(result.content).map(([lang, text]) => (
                    <div key={lang}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                          {lang === 'FR' ? '🇫🇷 Français' : lang === 'EN' ? '🇬🇧 English' : '🇲🇦 العربية'}
                        </span>
                        <button onClick={() => copy(text, lang)}
                          style={{ padding: '4px 10px', borderRadius: 6, background: copied === lang ? 'var(--emerald)' : 'var(--surface)', color: copied === lang ? '#fff' : 'var(--ink-muted)', border: '1px solid var(--surface-3)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {copied === lang ? <FiCheck size={12} /> : <FiCopy size={12} />} Copier
                        </button>
                      </div>
                      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 14, fontSize: '0.875rem', lineHeight: 1.7, direction: lang === 'AR' ? 'rtl' : 'ltr' }}>
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.type === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'seoTitle', label: 'Titre SEO', content: result.content.seoTitle },
                    { key: 'seoDescription', label: 'Méta description', content: result.content.seoDescription },
                  ].map(({ key, label, content }) => (
                    <div key={key}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>{label}</span>
                        <button onClick={() => copy(content, key)}
                          style={{ padding: '4px 10px', borderRadius: 6, background: copied === key ? 'var(--emerald)' : 'var(--surface)', color: copied === key ? '#fff' : 'var(--ink-muted)', border: '1px solid var(--surface-3)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {copied === key ? <FiCheck size={12} /> : <FiCopy size={12} />} Copier
                        </button>
                      </div>
                      <p style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 14, fontSize: '0.875rem', lineHeight: 1.6 }}>{content}</p>
                    </div>
                  ))}
                  {result.content.seoKeywords?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 8 }}>Mots-clés</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {result.content.seoKeywords.map(kw => (
                          <span key={kw} style={{ background: 'var(--gold-pale)', color: 'var(--ink)', padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600 }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.type === 'price' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
                  {[
                    { label: 'Prix suggéré', value: `${result.content.suggestedPrice} MAD`, color: 'var(--emerald)', big: true },
                    { label: 'Prix minimum', value: `${result.content.minPrice} MAD`, color: 'var(--sky)' },
                    { label: 'Prix maximum', value: `${result.content.maxPrice} MAD`, color: 'var(--crimson)' },
                  ].map(({ label, value, color, big }) => (
                    <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 6 }}>{label}</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: big ? '1.6rem' : '1.2rem', fontWeight: 800, color }}>{value}</p>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1/-1', background: 'var(--gold-pale)', borderRadius: 'var(--radius)', padding: 14, fontSize: '0.875rem', lineHeight: 1.6, border: '1px solid rgba(201,168,76,0.3)' }}>
                    <strong>Analyse :</strong> {result.content.reasoning}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:768px){div > div:last-child > div:first-child{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
