export async function fetchResearch(query) {
    const response = await fetch(`/api/research?q=${encodeURIComponent(query)}`);
    const data = (await response.json());
    if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch research right now.');
    }
    return data;
}
