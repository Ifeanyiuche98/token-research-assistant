export function getSectorIntelligence(sector) {
    switch (sector) {
        case 'Layer 1':
            return {
                profile: 'Layer 1 assets are foundational blockchain networks that usually compete on security, scalability, decentralization, and ecosystem growth.',
                watchouts: ['Developer adoption', 'Network activity', 'Competition from other Layer 1 networks']
            };
        case 'DeFi':
            return {
                profile: 'DeFi assets are linked to decentralized financial services such as trading, lending, liquidity, and on-chain financial infrastructure.',
                watchouts: ['Protocol usage', 'Liquidity depth', 'Smart contract and competitive risk']
            };
        case 'NFT / Gaming':
            return {
                profile: 'NFT / Gaming assets are tied to digital collectibles, game ecosystems, and user engagement-driven crypto products.',
                watchouts: ['User retention', 'Market sentiment', 'Platform adoption']
            };
        case 'AI':
            return {
                profile: 'AI sector assets typically connect crypto networks or tokens with artificial intelligence themes, tools, or infrastructure.',
                watchouts: ['Real product traction', 'Narrative-driven volatility', 'Differentiation from competing AI projects']
            };
        case 'Infrastructure':
            return {
                profile: 'Infrastructure assets support core crypto functions such as data, interoperability, oracle services, and network tooling.',
                watchouts: ['Integration demand', 'Ecosystem dependence', 'Competition from substitute infrastructure providers']
            };
        case 'Meme':
            return {
                profile: 'Meme assets are usually driven more by community attention, speculation, and social momentum than by deep protocol fundamentals.',
                watchouts: ['Sharp volatility', 'Weak long-term defensibility', 'Liquidity swings']
            };
        case 'Stablecoin':
            return {
                profile: 'Stablecoin assets aim to maintain price stability and often serve as transactional or reserve instruments in crypto markets.',
                watchouts: ['Reserve design', 'Peg stability', 'Counterparty or regulatory risk']
            };
        case 'Exchange':
            return {
                profile: 'Exchange-related assets are typically tied to trading platforms, fee ecosystems, or exchange utility and incentive models.',
                watchouts: ['Trading activity', 'Regulatory exposure', 'Platform dependence']
            };
        default:
            return {
                profile: 'Sector intelligence is limited because the asset could not be mapped confidently to a known sector.',
                watchouts: ['Incomplete classification', 'Limited context', 'Need for manual review']
            };
    }
}
