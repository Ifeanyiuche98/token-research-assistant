export function mapResearchResponseToNote(response) {
    const result = response.result;
    if (!result) {
        return null;
    }
    const summary = result.project.description ?? response.message;
    const useCase = result.project.categories.length
        ? `Categories: ${result.project.categories.join(', ')}.`
        : response.status === 'live'
            ? 'Live project details were found, but category data is limited in the current response.'
            : 'Local fallback research is being shown because live data was unavailable.';
    const risks = response.status === 'fallback'
        ? 'This is fallback research, so verify project details with official documentation and trusted market sources before relying on it.'
        : 'Market data can change quickly. Always verify liquidity, token identity, and official links before making any decision.';
    const ecosystemNotes = [
        result.links.homepage[0] ? `Homepage: ${result.links.homepage[0]}` : null,
        result.links.github[0] ? `GitHub: ${result.links.github[0]}` : null,
        result.links.twitter[0] ? `Twitter: ${result.links.twitter[0]}` : null,
        result.market.lastUpdated ? `Last updated: ${result.market.lastUpdated}` : null
    ]
        .filter(Boolean)
        .join('\n');
    return {
        project: result.identity.name ?? response.query.raw,
        summary,
        useCase,
        risks,
        ecosystemNotes: ecosystemNotes || 'No extra ecosystem notes are available yet.',
        matchedOn: response.query.raw,
        aliases: result.identity.symbol ? [result.identity.symbol] : [],
        isFallback: response.status === 'fallback'
    };
}
