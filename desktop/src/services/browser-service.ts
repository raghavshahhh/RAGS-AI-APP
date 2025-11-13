class BrowserService {
  async search(query: string): Promise<string> {
    try {
      // Try DuckDuckGo instant answer API
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
      const data = await response.json();
      
      if (data.AbstractText) {
        return data.AbstractText;
      }
      
      // Fallback to opening in browser
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      return `मैंने "${query}" search कर दिया browser में। Check करो!`;
    } catch (error) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      return `Browser में search खुल गया है।`;
    }
  }

  openWebsite(url: string): string {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
      return `${url} खोल दिया है।`;
    } catch (error) {
      return 'Website खोलने में problem आई।';
    }
  }

  openMap(location: string): string {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
    window.open(url, '_blank');
    return `${location} का map खोल दिया।`;
  }

  async getWeather(city: string): Promise<string> {
    // Placeholder - real weather API can be added
    return `${city} का weather check करने के लिए internet connection चाहिए। Weather.com खोलूं?`;
  }
}

export const browserService = new BrowserService();
