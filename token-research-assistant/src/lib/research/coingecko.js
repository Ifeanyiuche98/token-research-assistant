import { calculateRiskAnalysis } from '../../utils/calculateRiskAnalysis';
import { generateSignalInterpretation } from '../../utils/generateSignalInterpretation';
import { generateResearchBrief } from '../../utils/generateResearchBrief';
import { mapToSector } from '../../utils/mapToSector';
import { getSectorIntelligence } from '../../utils/getSectorIntelligence';
import { isEthereumContractAddress } from './query';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex/tokens';
const CONTRACT_LOOKUP_CHAINS = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'arbitrum-one', 'avalanche'];
function cleanText(value) {
    if (!value)
        return null;
    const stripped = value
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
    if (!stripped)
        return null;
    return stripped.length > 360 ? `${stripped.slice(0, 357).trim()}...` : stripped;
}
function cleanUrlList(values) {
    if (!values)
        return [];
    const unique = new Set();
    for (const value of values) {
        const next = value?.trim();
        if (next && /^https?:\/\//i.test(next)) {
            unique.add(next);
        }
    }
    return [...unique];
}
function buildSocialUrl(prefix, handle) {
    const cleaned = handle?.trim();
    if (!cleaned)
        return [];
    return [`${prefix}${cleaned}`];
}
async function fetchJson(url, source = 'CoinGecko') {
    const response = await fetch(url, {
        headers: {
            accept: 'application/json'
        }
    });
    if (!response.ok) {
        const error = new Error(`${source} request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return (await response.json());
}
function toNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
async function getDexScreenerPair(contractAddress) {
    try {
        const data = await fetchJson(`${DEXSCREENER_BASE_URL}/${encodeURIComponent(contractAddress)}`, 'DEXScreener');
        const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
        if (pairs.length === 0) {
            return null;
        }
        return pairs.reduce((bestPair, pair) => {
            if (!bestPair) {
                return pair;
            }
            const bestLiquidity = bestPair.liquidity?.usd ?? -1;
            const nextLiquidity = pair.liquidity?.usd ?? -1;
            return nextLiquidity > bestLiquidity ? pair : bestPair;
        }, null);
    }
    catch (error) {
        console.warn('[dexscreener] Token lookup failed', error);
        return null;
    }
}
function buildDexResponse(query, contractAddress, pair) {
    const homepage = cleanUrlList((pair.info?.websites ?? []).map((website) => website.url));
    const socials = Array.isArray(pair.info?.socials) ? pair.info.socials : [];
    const twitter = cleanUrlList(socials.filter((social) => social.type === 'twitter').map((social) => social.url));
    const telegram = cleanUrlList(socials.filter((social) => social.type === 'telegram').map((social) => social.url));
    const market = {
        priceUsd: toNumber(pair.priceUsd),
        marketCapUsd: null,
        fullyDilutedValuationUsd: toNumber(pair.fdv),
        volume24hUsd: toNumber(pair.volume?.h24),
        liquidityUsd: toNumber(pair.liquidity?.usd),
        change24hPct: toNumber(pair.priceChange?.h24),
        marketCapRank: null,
        lastUpdated: null
    };
    const description = `${pair.baseToken?.name ?? query.raw} is being sourced from DEX liquidity pool data via DEXScreener. Treat this as limited-verification market context and verify the contract before interacting.`;
    const project = {
        description,
        categories: ['DEX / Unverified'],
        homepageUrl: homepage[0] ?? pair.url ?? null,
        blockchainSiteUrls: pair.url ? cleanUrlList([pair.url]) : [],
        officialTwitterHandle: null,
        officialTelegramHandle: null,
        sentimentVotesUpPct: null,
        sentimentVotesDownPct: null
    };
    const risk = {
        level: 'unknown',
        score: null,
        summary: 'Risk scoring is limited because this token was sourced from DEX liquidity data without CoinGecko verification, and market cap is unavailable outside FDV estimates.',
        signals: [
            {
                key: 'missing_market_data',
                label: 'Verification status',
                value: 'DEX-only token — verify contract before interacting',
                impact: 'medium'
            },
            {
                key: 'missing_market_data',
                label: 'Market cap coverage',
                value: 'Market cap unavailable; FDV shown separately when present',
                impact: 'medium'
            }
        ]
    };
    const signalInterpretation = {
        summary: 'Token sourced from DEX liquidity pools. Verify the contract and liquidity conditions before interacting, and treat FDV separately from market cap.',
        tone: 'neutral',
        signals: [
            {
                key: 'missing_data',
                label: 'DEX-only source',
                detail: 'This result comes from DEXScreener fallback data rather than the verified CoinGecko contract pipeline.',
                tone: 'neutral'
            },
            {
                key: 'missing_data',
                label: 'Valuation context',
                detail: 'Market cap is left blank for DEX fallback results; only FDV is shown when available from DEXScreener.',
                tone: 'neutral'
            }
        ]
    };
    const researchBrief = {
        headline: `${pair.baseToken?.name ?? query.raw} DEX market snapshot`,
        body: `${pair.baseToken?.name ?? query.raw} was resolved from DEX liquidity pool data, so treat the market snapshot as exploratory, verify the contract before interacting, and read valuation figures as FDV rather than confirmed market cap.`
    };
    const sector = mapToSector(project.categories, pair.baseToken?.name ?? query.raw, project.description);
    const sectorIntelligence = getSectorIntelligence(sector);
    return {
        status: 'live',
        query,
        result: {
            identity: {
                id: contractAddress,
                name: pair.baseToken?.name ?? query.raw,
                symbol: pair.baseToken?.symbol?.toUpperCase() ?? null,
                slug: pair.pairAddress ?? contractAddress,
                source: 'dexscreener',
                confidence: 'medium'
            },
            market,
            risk,
            signalInterpretation,
            researchBrief,
            sector,
            sectorIntelligence,
            project,
            media: {
                thumbUrl: pair.info?.imageUrl ?? null,
                smallUrl: pair.info?.imageUrl ?? null,
                largeUrl: pair.info?.imageUrl ?? null
            },
            links: {
                homepage,
                blockchainSite: project.blockchainSiteUrls,
                officialForum: [],
                chat: [],
                announcement: [],
                twitter,
                telegram,
                github: [],
                subreddit: []
            },
            fallback: {
                used: false,
                reason: 'none',
                localNoteId: null
            },
            sourceMeta: {
                primarySource: 'dexscreener',
                fetchedAt: new Date().toISOString(),
                liveAttempted: true,
                liveSucceeded: true
            }
        },
        message: 'Live research data retrieved successfully via DEXScreener fallback.',
        error: null
    };
}
function buildLiveResponse(query, coin) {
    const homepage = cleanUrlList(coin.links?.homepage);
    const blockchainSite = cleanUrlList(coin.links?.blockchain_site);
    const officialForum = cleanUrlList(coin.links?.official_forum_url);
    const chat = cleanUrlList(coin.links?.chat_url);
    const announcement = cleanUrlList(coin.links?.announcement_url);
    const github = cleanUrlList(coin.links?.repos_url?.github);
    const subreddit = coin.links?.subreddit_url ? cleanUrlList([coin.links.subreddit_url]) : [];
    const twitter = buildSocialUrl('https://twitter.com/', coin.links?.twitter_screen_name);
    const telegram = buildSocialUrl('https://t.me/', coin.links?.telegram_channel_identifier);
    const market = {
        priceUsd: coin.market_data?.current_price?.usd ?? null,
        marketCapUsd: coin.market_data?.market_cap?.usd ?? null,
        fullyDilutedValuationUsd: coin.market_data?.fully_diluted_valuation?.usd ?? null,
        volume24hUsd: coin.market_data?.total_volume?.usd ?? null,
        liquidityUsd: null,
        change24hPct: coin.market_data?.price_change_percentage_24h ?? null,
        marketCapRank: coin.market_cap_rank ?? null,
        lastUpdated: coin.last_updated ?? null
    };
    const risk = calculateRiskAnalysis(market);
    const signalInterpretation = generateSignalInterpretation(market, risk);
    const project = {
        description: cleanText(coin.description?.en),
        categories: coin.categories ?? [],
        homepageUrl: homepage[0] ?? null,
        blockchainSiteUrls: blockchainSite,
        officialTwitterHandle: coin.links?.twitter_screen_name?.trim() || null,
        officialTelegramHandle: coin.links?.telegram_channel_identifier?.trim() || null,
        sentimentVotesUpPct: coin.sentiment_votes_up_percentage ?? null,
        sentimentVotesDownPct: coin.sentiment_votes_down_percentage ?? null
    };
    const researchBrief = generateResearchBrief(market, risk, signalInterpretation, {
        name: coin.name ?? query.raw,
        description: project.description,
        categories: project.categories
    });
    const sector = mapToSector(project.categories, coin.name ?? query.raw, project.description);
    const sectorIntelligence = getSectorIntelligence(sector);
    const result = {
        identity: {
            id: coin.id ?? null,
            name: coin.name ?? null,
            symbol: coin.symbol ? coin.symbol.toUpperCase() : null,
            slug: coin.id ?? null,
            source: 'coingecko',
            confidence: 'high'
        },
        market,
        risk,
        signalInterpretation,
        researchBrief,
        sector,
        sectorIntelligence,
        project,
        media: {
            thumbUrl: coin.image?.thumb ?? null,
            smallUrl: coin.image?.small ?? null,
            largeUrl: coin.image?.large ?? null
        },
        links: {
            homepage,
            blockchainSite,
            officialForum,
            chat,
            announcement,
            twitter,
            telegram,
            github,
            subreddit
        },
        fallback: {
            used: false,
            reason: 'none',
            localNoteId: null
        },
        sourceMeta: {
            primarySource: 'coingecko',
            fetchedAt: new Date().toISOString(),
            liveAttempted: true,
            liveSucceeded: true
        }
    };
    return {
        status: 'live',
        query,
        result,
        message: 'Live research data retrieved successfully.',
        error: null
    };
}
export async function getCoinGeckoResearchResponse(query) {
    let contractLookupError = null;
    if (isEthereumContractAddress(query.raw)) {
        const contractAddress = query.raw.trim().toLowerCase();
        for (const chain of CONTRACT_LOOKUP_CHAINS) {
            const contractUrl = `${COINGECKO_BASE_URL}/coins/${chain}/contract/${encodeURIComponent(contractAddress)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
            try {
                const contractResponse = await fetch(contractUrl, {
                    headers: {
                        accept: 'application/json'
                    }
                });
                if (!contractResponse.ok) {
                    const responseText = await contractResponse.text();
                    const error = new Error(`CoinGecko contract lookup failed on ${chain} with status ${contractResponse.status}`);
                    error.status = contractResponse.status;
                    error.contractLookup = {
                        attempted: true,
                        url: contractUrl,
                        address: contractAddress,
                        chain,
                        status: contractResponse.status,
                        responseText
                    };
                    throw error;
                }
                const contractData = (await contractResponse.json());
                console.info(`[coingecko] Contract lookup succeeded on chain: ${chain}`);
                return buildLiveResponse(query, contractData);
            }
            catch (error) {
                contractLookupError = error;
                console.warn(`[coingecko] Contract lookup failed on chain: ${chain}`, error);
            }
        }
        const dexPair = await getDexScreenerPair(contractAddress);
        if (dexPair) {
            console.info('[dexscreener] Contract lookup succeeded via fallback');
            return buildDexResponse(query, contractAddress, dexPair);
        }
    }
    const searchUrl = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query.raw)}`;
    const searchData = await fetchJson(searchUrl);
    const exactMatch = searchData.coins?.find((coin) => coin.id.toLowerCase() === query.normalized || coin.name.toLowerCase() === query.normalized || coin.symbol.toLowerCase() === query.normalized);
    const selectedCoin = exactMatch ?? searchData.coins?.[0];
    if (!selectedCoin?.id) {
        if (contractLookupError) {
            throw contractLookupError;
        }
        return null;
    }
    const detailUrl = `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(selectedCoin.id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const detailData = await fetchJson(detailUrl);
    return buildLiveResponse(query, detailData);
}
