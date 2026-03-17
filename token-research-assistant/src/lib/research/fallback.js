import { getResearchNote } from '../../data/mockResearch';
function slugify(value) {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
}
export function getFallbackResearchResponse(query) {
    const note = getResearchNote(query.raw);
    const signalInterpretation = {
        summary: 'Signal interpretation is limited because live market data is unavailable for this result.',
        tone: 'neutral',
        signals: [
            {
                key: 'missing_data',
                label: 'Incomplete market data',
                detail: 'Live market fields are unavailable in fallback mode, so only limited interpretation is possible.',
                tone: 'neutral'
            }
        ]
    };
    const result = {
        identity: {
            id: `local-${slugify(note.project)}`,
            name: note.project,
            symbol: null,
            slug: slugify(note.project),
            source: 'local',
            confidence: note.isFallback ? 'medium' : 'high'
        },
        market: {
            priceUsd: null,
            marketCapUsd: null,
            fullyDilutedValuationUsd: null,
            volume24hUsd: null,
            change24hPct: null,
            marketCapRank: null,
            lastUpdated: null
        },
        risk: {
            level: 'unknown',
            score: null,
            summary: 'Market risk is unavailable because live market data could not be loaded for this result.',
            signals: [
                {
                    key: 'missing_market_data',
                    label: 'Live market data',
                    value: 'Unavailable in fallback mode',
                    impact: 'medium'
                }
            ]
        },
        signalInterpretation,
        project: {
            description: note.summary,
            categories: [],
            homepageUrl: null,
            blockchainSiteUrls: [],
            officialTwitterHandle: null,
            officialTelegramHandle: null,
            sentimentVotesUpPct: null,
            sentimentVotesDownPct: null
        },
        media: {
            thumbUrl: null,
            smallUrl: null,
            largeUrl: null
        },
        links: {
            homepage: [],
            blockchainSite: [],
            officialForum: [],
            chat: [],
            announcement: [],
            twitter: [],
            telegram: [],
            github: [],
            subreddit: []
        },
        fallback: {
            used: true,
            reason: note.isFallback ? 'not_listed' : 'live_lookup_failed',
            localNoteId: slugify(note.project)
        },
        sourceMeta: {
            primarySource: 'local',
            fetchedAt: new Date().toISOString(),
            liveAttempted: true,
            liveSucceeded: false
        }
    };
    return {
        status: 'fallback',
        query,
        result,
        message: 'Live data unavailable. Showing local fallback research.',
        error: null
    };
}
