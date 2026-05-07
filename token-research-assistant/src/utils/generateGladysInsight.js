export function buildGladysInput(response) {
    const result = response.result;
    if (!result || !result.risk || !result.signalInterpretation)
        return null;
    return {
        token: {
            name: result.identity.name,
            symbol: result.identity.symbol,
            source: result.identity.source,
            confidence: result.identity.confidence
        },
        risk: {
            level: result.risk.level,
            band: result.risk.band,
            score: result.risk.score,
            summaryMode: result.risk.summaryMode,
            dominantDriver: result.risk.dominantDriver,
            overrideReason: result.risk.overrideReason,
            flags: result.risk.flags ?? [],
            honeypot: result.risk.details?.honeypot ?? null,
            trustLabel: result.risk.details?.trustLabel ?? null,
            trustScore: result.risk.details?.trustScore ?? null,
            liquidityRisk: result.risk.details?.liquidityRisk ?? null,
            volumeAnomaly: result.risk.details?.volumeAnomaly ?? null,
            ageRisk: result.risk.details?.ageRisk ?? null
        },
        signalInterpretation: {
            tone: result.signalInterpretation.tone,
            summary: result.signalInterpretation.summary,
            topSignals: result.signalInterpretation.signals.slice(0, 3).map((signal) => `${signal.label}: ${signal.detail}`)
        },
        researchBrief: {
            headline: result.researchBrief?.headline ?? null,
            body: result.researchBrief?.body ?? null
        },
        sector: result.sector,
        fallback: {
            used: result.fallback.used,
            reason: result.fallback.reason
        }
    };
}
function unique(items) {
    return [...new Set(items.filter((item) => Boolean(item && item.trim())))];
}
function buildHeadline(input) {
    if (input.risk.overrideReason === 'honeypot_exit_risk')
        return 'GLADYS: Severe exit-risk warning';
    if (input.risk.level === 'high')
        return 'GLADYS: This setup looks structurally fragile';
    if (input.token.source === 'dexscreener' && input.risk.band === 'lower')
        return 'GLADYS: Calm visible setup, limited trust';
    if (input.risk.level === 'medium')
        return 'GLADYS: Constructive in parts, but caution still leads';
    if (input.risk.level === 'low')
        return 'GLADYS: Broadly stable setup';
    return 'GLADYS: Limited-confidence read';
}
function buildSummary(input) {
    const tokenName = input.token.name ?? 'This token';
    if (input.risk.overrideReason === 'honeypot_exit_risk') {
        return `${tokenName} should be treated as a serious risk case because available checks suggest users may struggle to sell or exit normally.`;
    }
    if (input.token.source === 'dexscreener' && input.risk.band === 'lower') {
        return `${tokenName} looks relatively calm from the visible market data, but it is still being interpreted from an unverified DEX context rather than a stronger verified listing path.`;
    }
    if (input.risk.level === 'high') {
        return `${tokenName} currently reads as a high-risk setup because the weaker structural signals are strong enough to outweigh any supportive ones.`;
    }
    if (input.risk.level === 'medium') {
        return `${tokenName} has some constructive traits, but the risk picture is still mixed enough that caution should stay in control.`;
    }
    if (input.risk.level === 'low') {
        return `${tokenName} looks broadly stable in the current snapshot, with no major structural stress dominating the read.`;
    }
    return `${tokenName} does not have enough complete market context for a stronger explanation, so this should be treated as a limited snapshot.`;
}
function buildRiskCall(input) {
    if (input.risk.overrideReason === 'honeypot_exit_risk')
        return 'Main risk call: contract-level exit risk dominates everything else.';
    if (input.risk.overrideReason === 'thin_liquidity_weak_visibility')
        return 'Main risk call: thin liquidity and weak trust visibility make this setup hard to rely on.';
    switch (input.risk.dominantDriver) {
        case 'liquidity':
            return 'Main risk call: liquidity quality is the biggest weakness in the current read.';
        case 'volatility':
            return 'Main risk call: short-term price instability is the biggest caution driver.';
        case 'fdv_gap':
            return 'Main risk call: valuation stretch is keeping dilution risk in focus.';
        case 'scale':
            return 'Main risk call: smaller market scale leaves the setup easier to destabilize.';
        case 'trust':
            return 'Main risk call: trust-layer signals are weaker than the cleaner market surface suggests.';
        case 'honeypot':
            return 'Main risk call: exit-risk checks materially weaken confidence in normal token behavior.';
        default:
            return 'Main risk call: the current read is driven by a mix of market structure and trust signals.';
    }
}
function buildConfidenceNote(input) {
    if (input.token.source === 'coingecko' && !input.fallback.used) {
        return 'Confidence note: this read has relatively stronger source confidence because it comes through the primary verified research path.';
    }
    if (input.token.source === 'dexscreener') {
        return 'Confidence note: this read is useful, but confidence should stay limited because the token is being interpreted from DEX-only / unverified context.';
    }
    if (input.fallback.used || input.token.source === 'local') {
        return 'Confidence note: this result is partly fallback-based, so treat it as directional rather than fully authoritative.';
    }
    return 'Confidence note: treat this as a limited-confidence snapshot and verify important details manually.';
}
function buildActionNote(input) {
    if (input.risk.overrideReason === 'honeypot_exit_risk') {
        return 'What to do next: do not assume normal exits are possible — verify sellability, taxes, and contract safety before trusting this market.';
    }
    if (input.token.source === 'dexscreener' && input.risk.band === 'lower') {
        return 'What to do next: verify contract authenticity, liquidity depth, and any external project links before treating the calm read as genuine safety.';
    }
    if (input.risk.level === 'high') {
        return 'What to do next: double-check liquidity, recent behavior, and trust flags before treating any short-term upside as durable.';
    }
    if (input.risk.level === 'medium') {
        return 'What to do next: monitor the main caution drivers and confirm whether the stronger-looking signals remain intact.';
    }
    return 'What to do next: keep an eye on broader market conditions and re-check the token if the source context or market structure changes.';
}
export function generateGladysInsight(input) {
    const bullets = unique([
        input.researchBrief.body,
        input.signalInterpretation.summary,
        input.signalInterpretation.topSignals[0],
        input.token.source === 'dexscreener' ? 'Source context: DEX-only / unverified token path.' : null,
        input.risk.honeypot === true ? 'Trust check: honeypot warning surfaced.' : null,
        input.risk.liquidityRisk === 'high' ? 'Trust check: liquidity depth is very thin.' : null,
        input.risk.volumeAnomaly === true ? 'Trust check: trading activity looks unusually high relative to liquidity.' : null,
        input.risk.ageRisk === 'high' ? 'Trust check: market history is still very limited.' : null
    ]).slice(0, 4);
    return {
        headline: buildHeadline(input),
        summary: buildSummary(input),
        riskCall: buildRiskCall(input),
        confidenceNote: buildConfidenceNote(input),
        actionNote: buildActionNote(input),
        tone: input.risk.overrideReason === 'honeypot_exit_risk' ? 'negative' : input.signalInterpretation.tone,
        bullets
    };
}
