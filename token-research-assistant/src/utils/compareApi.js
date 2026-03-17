export async function fetchComparison(leftQuery, rightQuery) {
    const response = await fetch(`/api/compare?a=${encodeURIComponent(leftQuery)}&b=${encodeURIComponent(rightQuery)}`);
    const data = (await response.json());
    if (!response.ok) {
        throw new Error(data.message || 'Unable to compare tokens right now.');
    }
    return data;
}
