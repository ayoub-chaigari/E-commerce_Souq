const axios = require('axios');
const AIGeneration = require('../models/AIGeneration');
const { sendSuccess, sendError } = require('../utils/response');

const callAI = async (prompt, systemPrompt = '') => {
  const response = await axios.post(
    process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      max_tokens: 1000,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  const tokensUsed = response.data.usage?.total_tokens || 0;
  return { content, tokensUsed };
};

// @desc    Generate product description
// @route   POST /api/ai/generate-description
// @access  Vendor
exports.generateDescription = async (req, res, next) => {
  try {
    const { productName, category, features, language = 'FR', productId } = req.body;

    if (!productName) return sendError(res, 400, 'Product name is required.');

    const langMap = { FR: 'French', EN: 'English', AR: 'Arabic' };
    const langName = langMap[language] || 'French';

    const prompt = `Write a compelling e-commerce product description in ${langName} for:
Product: ${productName}
Category: ${category || 'General'}
Key features: ${features || 'Not specified'}

Requirements:
- 100-200 words
- Highlight benefits, not just features
- Professional and persuasive tone
- Include relevant keywords naturally
- End with a subtle call-to-action`;

    const { content, tokensUsed } = await callAI(prompt, 'You are an expert e-commerce copywriter.');

    const record = await AIGeneration.create({
      vendor: req.user.id,
      product: productId || undefined,
      type: 'description',
      input: { productName, category, features, language },
      output: { description: content },
      language,
      tokensUsed,
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    });

    sendSuccess(res, 200, 'Description generated.', {
      description: content,
      generationId: record._id,
    });
  } catch (error) {
    if (error.response?.status === 401) return sendError(res, 500, 'AI service authentication failed.');
    if (error.response?.status === 429) return sendError(res, 429, 'AI rate limit reached. Try again later.');
    next(error);
  }
};

// @desc    Generate multilingual descriptions
// @route   POST /api/ai/generate-multilingual
// @access  Vendor
exports.generateMultilingual = async (req, res, next) => {
  try {
    const { productName, category, features, productId } = req.body;

    if (!productName) return sendError(res, 400, 'Product name is required.');

    const prompt = `Generate product descriptions in 3 languages for an e-commerce marketplace.
Product: ${productName}
Category: ${category || 'General'}
Features: ${features || 'Not specified'}

Provide exactly this JSON format (no markdown):
{
  "FR": "French description (100-150 words)",
  "EN": "English description (100-150 words)",
  "AR": "Arabic description (100-150 words)"
}`;

    const { content, tokensUsed } = await callAI(prompt, 'You are a multilingual e-commerce copywriter. Respond only with valid JSON.');

    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return sendError(res, 500, 'AI returned invalid format. Please retry.');
    }

    await AIGeneration.create({
      vendor: req.user.id,
      product: productId || undefined,
      type: 'description',
      input: { productName, category, features },
      output: parsed,
      tokensUsed,
      model: process.env.AI_MODEL,
    });

    sendSuccess(res, 200, 'Multilingual descriptions generated.', { descriptions: parsed });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate SEO metadata
// @route   POST /api/ai/generate-seo
// @access  Vendor
exports.generateSEO = async (req, res, next) => {
  try {
    const { productName, description, category } = req.body;

    if (!productName) return sendError(res, 400, 'Product name is required.');

    const prompt = `Generate SEO metadata for this e-commerce product.
Product: ${productName}
Category: ${category || 'General'}
Description: ${description || 'Not provided'}

Respond in this exact JSON format (no markdown):
{
  "seoTitle": "60 chars max title",
  "seoDescription": "155 chars max meta description",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const { content, tokensUsed } = await callAI(prompt, 'You are an SEO expert for e-commerce. Respond only with valid JSON.');

    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return sendError(res, 500, 'AI returned invalid format.');
    }

    await AIGeneration.create({
      vendor: req.user.id,
      type: 'seo',
      input: { productName, description, category },
      output: parsed,
      tokensUsed,
      model: process.env.AI_MODEL,
    });

    sendSuccess(res, 200, 'SEO metadata generated.', { seo: parsed });
  } catch (error) {
    next(error);
  }
};

// @desc    Suggest price
// @route   POST /api/ai/suggest-price
// @access  Vendor
exports.suggestPrice = async (req, res, next) => {
  try {
    const { productName, category, features, currentPrice } = req.body;

    const prompt = `You are a pricing analyst for a Moroccan e-commerce marketplace.
Suggest a competitive price for:
Product: ${productName}
Category: ${category || 'General'}
Features: ${features || 'Not specified'}
${currentPrice ? `Current price: ${currentPrice} MAD` : ''}

Respond in JSON only:
{
  "suggestedPrice": 0,
  "minPrice": 0,
  "maxPrice": 0,
  "currency": "MAD",
  "reasoning": "brief explanation"
}`;

    const { content, tokensUsed } = await callAI(prompt);

    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return sendError(res, 500, 'AI returned invalid format.');
    }

    await AIGeneration.create({
      vendor: req.user.id,
      type: 'price_suggestion',
      input: { productName, category, features, currentPrice },
      output: parsed,
      tokensUsed,
      model: process.env.AI_MODEL,
    });

    sendSuccess(res, 200, 'Price suggestion generated.', { pricing: parsed });
  } catch (error) {
    next(error);
  }
};

// @desc    Improve existing text
// @route   POST /api/ai/improve-text
// @access  Vendor
exports.improveText = async (req, res, next) => {
  try {
    const { text, language = 'FR', tone = 'professional' } = req.body;

    if (!text) return sendError(res, 400, 'Text is required.');

    const langMap = { FR: 'French', EN: 'English', AR: 'Arabic' };
    const prompt = `Improve the following ${langMap[language] || 'French'} product description.
Make it more ${tone}, engaging, and persuasive while keeping the same language.
Keep approximately the same length.

Original text:
${text}

Return only the improved text, no explanations.`;

    const { content, tokensUsed } = await callAI(prompt, 'You are an expert copywriter. Return only the improved text.');

    await AIGeneration.create({
      vendor: req.user.id,
      type: 'text_improvement',
      input: { text, language, tone },
      output: { improvedText: content },
      language,
      tokensUsed,
      model: process.env.AI_MODEL,
    });

    sendSuccess(res, 200, 'Text improved.', { improvedText: content });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor's AI generation history
// @route   GET /api/ai/history
// @access  Vendor
exports.getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { vendor: req.user.id };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AIGeneration.countDocuments(query);
    const generations = await AIGeneration.find(query)
      .populate('product', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    sendSuccess(res, 200, 'AI history retrieved.', {
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      generations,
    });
  } catch (error) {
    next(error);
  }
};
