import { getResearchNote } from '../../data/mockResearch';
function slugify(value) {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
}
export function getFallbackResearchResponse(query) {
    const note = getResearchNote(query.raw);
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
