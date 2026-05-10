import type { CompareResponse, GladysV2Insight } from '../types/compare';
import { buildGladysV2Input } from './buildGladysV2Input';
import { validateGladysV2Insight } from './validateGladysV2Insight';

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_GLADYS_V2_MODEL = 'gpt-4.1-mini';

type GladysV2Provider = 'disabled' | 'openai-api-key' | 'remote-proxy';

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function getEnvValue(key: string) {
  return process?.env?.[key];
}

function getGladysV2Provider(): GladysV2Provider {
  const explicit = getEnvValue('GLADYS_V2_PROVIDER')?.trim().toLowerCase();

  if (explicit === 'disabled') return 'disabled';
  if (explicit === 'remote-proxy') return 'remote-proxy';
  if (explicit === 'openai-api-key') return 'openai-api-key';

  if (getEnvValue('GLADYS_V2_PROXY_URL')?.trim()) return 'remote-proxy';
  if (getEnvValue('OPENAI_API_KEY')?.trim()) return 'openai-api-key';
  return 'disabled';
}

function isGladysV2Enabled() {
  return getGladysV2Provider() !== 'disabled';
}

function getGladysV2Model() {
  return getEnvValue('OPENAI_MODEL')?.trim() || getEnvValue('GLADYS_V2_MODEL')?.trim() || DEFAULT_GLADYS_V2_MODEL;
}

function getGladysV2ProxyUrl() {
  return getEnvValue('GLADYS_V2_PROXY_URL')?.trim() || null;
}

function getGladysV2ProxyToken() {
  return getEnvValue('GLADYS_V2_PROXY_TOKEN')?.trim() || null;
}

function buildPromptPayload(comparison: CompareResponse) {
  return buildGladysV2Input(comparison);
}

export function buildGladysV2SystemPrompt() {
  return [
    'You are GLADYS v2, a decision-oriented comparison analyst for crypto assets.',
    'Use only the structured comparison payload provided to you.',
    'Do not invent missing data, catalysts, metrics, or project claims.',
    'Respect severe risk signals and limited-data warnings.',
    'Return valid JSON only.',
    'Do not wrap the JSON in markdown code fences.'
  ].join(' ');
}

export function buildGladysV2UserPrompt(comparison: CompareResponse) {
  return [
    'Generate a structured GLADYS v2 compare insight.',
    'Stay grounded in the provided deterministic comparison signals.',
    'Be concise, cautious, and decision-useful.',
    'Return exactly one JSON object with this schema:',
    JSON.stringify(
      {
        headline: 'string',
        shortVerdict: 'string',
        strongerSideLabel: 'string',
        weakerSideLabel: 'string | null',
        decisiveTradeoff: 'string',
        watchout: 'string',
        dataConfidence: 'high | moderate | limited',
        decisionConfidence: 'high | moderate | low',
        confidenceRationale: 'string',
        priorityAngles: [
          {
            label: 'safer choice | cleaner structure | closer call | higher upside | better momentum profile | better long-term credibility',
            recommendation: 'string',
            reason: 'string'
          }
        ],
        reasons: ['string'],
        groundedInFallback: true
      },
      null,
      2
    ),
    'Payload:',
    JSON.stringify(buildPromptPayload(comparison), null, 2)
  ].join('\n\n');
}

function extractContent(response: OpenAiChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim();
  }

  return '';
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseGladysV2Response(text: string): unknown {
  const normalized = stripCodeFences(text);
  return JSON.parse(normalized);
}

async function callOpenAiApiKeyProvider(comparison: CompareResponse): Promise<string> {
  const apiKey = getEnvValue('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getGladysV2Model(),
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildGladysV2SystemPrompt() },
        { role: 'user', content: buildGladysV2UserPrompt(comparison) }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GLADYS v2 OpenAI request failed with status ${response.status}: ${detail.slice(0, 500)}`);
  }

  const json = (await response.json()) as OpenAiChatCompletionResponse;
  const content = extractContent(json);

  if (!content) {
    throw new Error('GLADYS v2 OpenAI response was empty.');
  }

  return content;
}

async function callRemoteProxyProvider(comparison: CompareResponse): Promise<string> {
  const proxyUrl = getGladysV2ProxyUrl();
  if (!proxyUrl) {
    throw new Error('GLADYS_V2_PROXY_URL is not configured.');
  }

  const proxyToken = getGladysV2ProxyToken();
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(proxyToken ? { Authorization: `Bearer ${proxyToken}` } : {})
    },
    body: JSON.stringify({
      task: 'gladys-compare-v2',
      provider: 'remote-proxy',
      model: getGladysV2Model(),
      systemPrompt: buildGladysV2SystemPrompt(),
      userPrompt: buildGladysV2UserPrompt(comparison),
      payload: buildPromptPayload(comparison)
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GLADYS v2 proxy request failed with status ${response.status}: ${detail.slice(0, 500)}`);
  }

  const json = (await response.json()) as { content?: string; output?: string; result?: string; data?: unknown };
  const content = [json.content, json.output, json.result].find((value): value is string => typeof value === 'string' && value.trim().length > 0);

  if (content) {
    return content.trim();
  }

  if (json.data && typeof json.data === 'object') {
    return JSON.stringify(json.data);
  }

  throw new Error('GLADYS v2 proxy response did not include usable content.');
}

async function callGladysV2Provider(comparison: CompareResponse): Promise<string> {
  const provider = getGladysV2Provider();

  switch (provider) {
    case 'openai-api-key':
      return callOpenAiApiKeyProvider(comparison);
    case 'remote-proxy':
      return callRemoteProxyProvider(comparison);
    default:
      throw new Error('GLADYS v2 provider is disabled.');
  }
}

export async function generateGladysCompareInsightV2(comparison: CompareResponse): Promise<GladysV2Insight | null> {
  if (!isGladysV2Enabled()) {
    return null;
  }

  try {
    const raw = await callGladysV2Provider(comparison);
    const candidate = parseGladysV2Response(raw);
    const validation = validateGladysV2Insight(candidate, comparison);
    return validation.ok ? validation.insight : null;
  } catch (error) {
    console.warn('[gladys-v2] Falling back to deterministic compare insight.', error);
    return null;
  }
}
