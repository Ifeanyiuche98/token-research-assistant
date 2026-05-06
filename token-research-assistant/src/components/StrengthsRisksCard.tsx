import type { ResearchResponse } from '../types/research';

type StrengthsRisksCardProps = {
  response: ResearchResponse;
};

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function buildModeSummary(response: ResearchResponse, strengths: string[], risks: string[]) {
  const risk = response.result?.risk;
  if (!risk || strengths.length === 0 || risks.length === 0) return null;

  switch (risk.summaryMode) {
    case 'stable':
      return 'The overall setup still reads relatively calm, with strengths clearly outweighing the current watchouts.';
    case 'stable_watchful':
      return 'The setup is broadly constructive, though a few caution points still deserve attention.';
    case 'mixed_cautious':
      if (risk.dominantDriver === 'trust') {
        return 'Some parts of the setup look constructive, but trust visibility is still too soft to treat the token as comfortably low risk.';
      }
      return 'Some parts of the setup look constructive, but the weaker areas are still meaningful enough to keep caution in control.';
    case 'high_risk_fragile':
      if (risk.overrideReason === 'honeypot_exit_risk') {
        return 'Severe exit-risk concerns dominate this read, so any supportive signals should be treated as secondary.';
      }
      return 'A few supportive signals may still exist, but the broader setup remains fragile enough for caution to dominate.';
    default:
      return null;
  }
}

function buildStrengthCandidates(response: ResearchResponse) {
  const result = response.result;
  if (!result) return [];

  const strengths: string[] = [];
  const { market, risk } = result;

  if (market.volume24hUsd !== null && market.volume24hUsd >= 10_000_000) {
    strengths.push('Healthy trading activity supports a more readable market setup.');
  }

  if (market.marketCapUsd !== null && market.marketCapUsd >= 1_000_000_000) {
    strengths.push('Larger market scale helps reduce structural fragility.');
  }

  if (market.change24hPct !== null && Math.abs(market.change24hPct) < 10) {
    strengths.push('Recent price action looks relatively contained rather than disorderly.');
  }

  if (market.marketCapUsd !== null && market.marketCapUsd > 0 && market.fullyDilutedValuationUsd !== null) {
    const fdvGap = market.fullyDilutedValuationUsd / market.marketCapUsd;
    if (fdvGap < 2) {
      strengths.push('FDV stays close enough to market cap to avoid obvious dilution stress.');
    }
  }

  if (market.marketCapRank !== null && market.marketCapRank <= 100) {
    strengths.push('A stronger market-cap rank supports better visibility and depth.');
  }

  if (risk?.details?.honeypot === false) {
    strengths.push('Available contract checks did not surface an exit-risk warning.');
  }

  return unique(strengths);
}

function buildRiskCandidates(response: ResearchResponse) {
  const result = response.result;
  if (!result) return [];

  const risks: string[] = [];
  const { market, risk, sector } = result;

  if (risk?.overrideReason === 'honeypot_exit_risk') {
    risks.push('Available checks suggest users may be unable to sell or transfer normally.');
  }

  if (risk?.details?.liquidityRisk === 'high' || (market.volume24hUsd !== null && market.volume24hUsd < 1_000_000)) {
    risks.push('Thin liquidity can make price behavior and execution quality difficult to trust.');
  } else if (risk?.details?.liquidityRisk === 'medium' || (market.volume24hUsd !== null && market.volume24hUsd < 10_000_000)) {
    risks.push('Liquidity is present, but still light enough for trading conditions to change quickly.');
  }

  if (market.change24hPct !== null) {
    const absoluteMove = Math.abs(market.change24hPct);
    if (absoluteMove >= 20) {
      risks.push('Short-term price behavior is highly unstable.');
    } else if (absoluteMove >= 10) {
      risks.push('Recent price action is active enough to keep reversal risk elevated.');
    }
  }

  if (market.marketCapUsd !== null && market.marketCapUsd < 100_000_000) {
    risks.push('Smaller market scale leaves the setup more exposed to sentiment shocks.');
  }

  if (market.marketCapUsd !== null && market.marketCapUsd > 0 && market.fullyDilutedValuationUsd !== null) {
    const fdvGap = market.fullyDilutedValuationUsd / market.marketCapUsd;
    if (fdvGap >= 5) {
      risks.push('A wide FDV gap raises dilution risk materially.');
    } else if (fdvGap >= 2) {
      risks.push('Valuation stretch is meaningful enough to keep dilution risk in view.');
    }
  }

  if (risk?.details?.volumeAnomaly === true) {
    risks.push('Trading activity looks unusually strong relative to available liquidity.');
  }

  if (risk?.details?.ageRisk === 'high') {
    risks.push('Very limited market history makes the setup harder to trust.');
  } else if (risk?.details?.ageRisk === 'medium') {
    risks.push('Short market history still limits confidence in the setup.');
  }

  if (risk?.summaryMode === 'stable') {
    if (sector === 'Layer 1' || sector === 'Exchange' || sector === 'Infrastructure' || sector === 'Stablecoin') {
      risks.push('Even stronger assets can still reprice quickly during broader crypto drawdowns.');
    } else {
      risks.push('Broader market sentiment can still weaken short-term conviction.');
    }
  }

  if (risk?.summaryMode === 'stable_watchful') {
    risks.push('The setup looks mostly healthy, but the softer signals still deserve monitoring.');
  }

  if (risk?.summaryMode === 'mixed_cautious' && risk.dominantDriver === 'trust') {
    risks.push('Trust visibility remains weaker than the cleaner surface metrics suggest.');
  }

  if (risk?.summaryMode === 'high_risk_fragile') {
    risks.push('Short-term positives do not outweigh the underlying structural fragility.');
  }

  return unique(risks);
}

function selectStrengths(response: ResearchResponse, candidates: string[]) {
  const risk = response.result?.risk;
  if (!risk) return [];

  const limit = risk.summaryMode === 'high_risk_fragile' ? 2 : 4;
  if (risk.overrideReason === 'honeypot_exit_risk') {
    return candidates.filter((item) => item.includes('exit-risk') || item.includes('contract checks')).slice(0, 1);
  }

  return candidates.slice(0, limit);
}

function selectRisks(response: ResearchResponse, candidates: string[]) {
  const risk = response.result?.risk;
  if (!risk) return [];

  const uniqueCandidates = unique(candidates);
  if (risk.summaryMode === 'stable') return uniqueCandidates.slice(0, 3);
  if (risk.summaryMode === 'stable_watchful') return uniqueCandidates.slice(0, 3);
  if (risk.summaryMode === 'mixed_cautious') return uniqueCandidates.slice(0, 4);
  return uniqueCandidates.slice(0, 4);
}

export function StrengthsRisksCard({ response }: StrengthsRisksCardProps) {
  const result = response.result;
  if (!result) return null;

  const strengthCandidates = buildStrengthCandidates(response);
  const riskCandidates = buildRiskCandidates(response);
  const strengths = selectStrengths(response, strengthCandidates);
  const risks = selectRisks(response, riskCandidates);
  const summary = buildModeSummary(response, strengths, risks);

  return (
    <section className="dashboard-card card dashboard-card-span-full">
      <div className="dashboard-card-header">
        <p className="dashboard-card-kicker">Strengths & risks</p>
      </div>

      {summary ? <p className="strengths-risks-summary">{summary}</p> : null}

      <div className="strengths-risks-grid">
        <div className="strengths-panel">
          <h3>Strengths</h3>
          {strengths.length > 0 ? (
            <ul className="dashboard-list dashboard-list-positive">
              {strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-muted-copy">
              {result.risk?.summaryMode === 'high_risk_fragile'
                ? 'Any supportive signals here are secondary to the broader risk picture.'
                : 'No clear positive indicators were strong enough to stand out in the current signal set.'}
            </p>
          )}
        </div>

        <div className="risks-panel">
          <h3>Risks</h3>
          {risks.length > 0 ? (
            <ul className="dashboard-list dashboard-list-negative">
              {risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-muted-copy">No material risk flags were surfaced from the currently available fields.</p>
          )}
        </div>
      </div>
    </section>
  );
}
