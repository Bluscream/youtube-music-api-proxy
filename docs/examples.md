# API Examples

This page contains comprehensive examples of how to use the YouTube Music API Proxy.

## 🔍 Search Examples

### Basic Search

```bash
# Search for songs
curl "https://your-api-domain.com/api/search?query=despacito&category=Songs"

# Search for videos
curl "https://your-api-domain.com/api/search?query=despacito&category=Videos"

# Search for artists
curl "https://your-api-domain.com/api/search?query=luis%20fonsi&category=Artists"

# Search for albums
curl "https://your-api-domain.com/api/search?query=despacito&category=Albums"
```

### Search with Authentication

```bash
# Set cookies as environment variable
export COOKIES="eyJjb29raWVzIjoi..."

# Search with authentication
curl "https://your-api-domain.com/api/search?query=despacito&cookies=$COOKIES"

# Search with location
curl "https://your-api-domain.com/api/search?query=despacito&location=US&cookies=$COOKIES"
```

### JavaScript Examples

```javascript
// Search for songs
async function searchSongs(query) {
  const response = await fetch(`https://your-api-domain.com/api/search?query=${encodeURIComponent(query)}&category=Songs`);
  const data = await response.json();
  return data;
}

// Search with authentication
async function searchWithAuth(query, cookies) {
  const response = await fetch(`https://your-api-domain.com/api/search?query=${encodeURIComponent(query)}&cookies=${cookies}`);
  const data = await response.json();
  return data;
}

// Usage
searchSongs('despacito').then(results => {
  console.log('Search results:', results);
});
```

### Python Examples

```python
import requests
import base64

# Search for songs
def search_songs(query):
    url = f"https://your-api-domain.com/api/search"
    params = {
        'query': query,
        'category': 'Songs'
    }
    response = requests.get(url, params=params)
    return response.json()

# Search with authentication
def search_with_auth(query, cookies):
    url = f"https://your-api-domain.com/api/search"
    params = {
        'query': query,
        'cookies': base64.b64encode(cookies.encode()).decode()
    }
    response = requests.get(url, params=params)
    return response.json()

# Usage
results = search_songs('despacito')
print(results)
```

## 🎵 Content Information Examples

### Get Song Information

```bash
# Get song details
curl "https://your-api-domain.com/api/song/dQw4w9WgXcQ"

# Get song with authentication
curl "https://your-api-domain.com/api/song/dQw4w9WgXcQ?cookies=$COOKIES"
```

### Get Album Information

```bash
# Get album details
curl "https://your-api-domain.com/api/album/MPREb_..."

# Get album with authentication
curl "https://your-api-domain.com/api/album/MPREb_...?cookies=$COOKIES"
```

### Get Artist Information

```bash
# Get artist details
curl "https://your-api-domain.com/api/artist/UC..."

# Get artist with authentication
curl "https://your-api-domain.com/api/artist/UC...?cookies=$COOKIES"
```

### Get Playlist Information

```bash
# Get playlist details
curl "https://your-api-domain.com/api/playlist/PL..."

# Get playlist with authentication
curl "https://your-api-domain.com/api/playlist/PL...?cookies=$COOKIES"
```

## 🎧 Streaming Examples

### Get Streaming Data

```bash
# Get streaming URLs
curl "https://your-api-domain.com/api/streaming/dQw4w9WgXcQ"

# Get streaming data with authentication
curl "https://your-api-domain.com/api/streaming/dQw4w9WgXcQ?cookies=$COOKIES"
```

### Direct Audio Streaming

```bash
# Stream audio directly
curl "https://your-api-domain.com/api/stream/dQw4w9WgXcQ.m4a" -o audio.m4a

# Stream with authentication
curl "https://your-api-domain.com/api/stream/dQw4w9WgXcQ.m4a?cookies=$COOKIES" -o audio.m4a

# Stream with quality preference
curl "https://your-api-domain.com/api/stream/dQw4w9WgXcQ.m4a?quality=AUDIO_QUALITY_HIGH" -o audio.m4a
```

### JavaScript Streaming

```javascript
// Stream audio in browser
async function streamAudio(videoId, cookies = null) {
  const url = cookies 
    ? `https://your-api-domain.com/api/stream/${videoId}.m4a?cookies=${cookies}`
    : `https://your-api-domain.com/api/stream/${videoId}.m4a`;
  
  const response = await fetch(url);
  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  
  const audio = new Audio(audioUrl);
  audio.play();
}

// Usage
streamAudio('dQw4w9WgXcQ');
```

### Python Streaming

```python
import requests

def download_audio(video_id, output_file, cookies=None):
    url = f"https://your-api-domain.com/api/stream/{video_id}.m4a"
    params = {}
    
    if cookies:
        params['cookies'] = base64.b64encode(cookies.encode()).decode()
    
    response = requests.get(url, params=params, stream=True)
    
    with open(output_file, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

# Usage
download_audio('dQw4w9WgXcQ', 'audio.m4a')
```

## 📚 Library Examples (Requires Authentication)

### Get Complete Library

```bash
# Get all library content
curl "https://your-api-domain.com/api/library?cookies=$COOKIES"
```

### Get Library Sections

```bash
# Get library songs
curl "https://your-api-domain.com/api/library/songs?cookies=$COOKIES"

# Get library albums
curl "https://your-api-domain.com/api/library/albums?cookies=$COOKIES"

# Get library artists
curl "https://your-api-domain.com/api/library/artists?cookies=$COOKIES"

# Get library subscriptions
curl "https://your-api-domain.com/api/library/subscriptions?cookies=$COOKIES"

# Get library podcasts
curl "https://your-api-domain.com/api/library/podcasts?cookies=$COOKIES"

# Get library playlists
curl "https://your-api-domain.com/api/library/playlists?cookies=$COOKIES"
```

### JavaScript Library Access

```javascript
// Get library songs
async function getLibrarySongs(cookies) {
  const response = await fetch(`https://your-api-domain.com/api/library/songs?cookies=${cookies}`);
  const data = await response.json();
  return data;
}

// Get complete library
async function getCompleteLibrary(cookies) {
  const response = await fetch(`https://your-api-domain.com/api/library?cookies=${cookies}`);
  const data = await response.json();
  return data;
}

// Usage
getLibrarySongs(cookies).then(library => {
  console.log('Library songs:', library.songs);
});
```

## 🔧 Advanced Examples

### Error Handling

```javascript
async function searchWithErrorHandling(query) {
  try {
    const response = await fetch(`https://your-api-domain.com/api/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search failed:', error.message);
    throw error;
  }
}
```

### Batch Processing

```javascript
// Search multiple queries
async function batchSearch(queries) {
  const promises = queries.map(query => 
    fetch(`https://your-api-domain.com/api/search?query=${encodeURIComponent(query)}`)
      .then(response => response.json())
  );
  
  const results = await Promise.all(promises);
  return results;
}

// Usage
const queries = ['despacito', 'shape of you', 'blinding lights'];
batchSearch(queries).then(results => {
  console.log('Batch search results:', results);
});
```

### Rate Limiting

```javascript
// Simple rate limiting
class RateLimitedAPI {
  constructor(domain, delay = 1000) {
    this.domain = domain;
    this.delay = delay;
    this.lastRequest = 0;
  }
  
  async request(endpoint, params = {}) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.delay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.delay - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
    
    const url = new URL(`https://${this.domain}/api/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => 
      url.searchParams.append(key, value)
    );
    
    const response = await fetch(url);
    return response.json();
  }
  
  async search(query, category = null, cookies = null) {
    const params = { query };
    if (category) params.category = category;
    if (cookies) params.cookies = cookies;
    
    return this.request('search', params);
  }
}

// Usage
const api = new RateLimitedAPI('your-api-domain.com', 1000);
api.search('despacito').then(results => {
  console.log(results);
});
```

## 🎯 Real-World Scenarios

### Music Player Integration

```javascript
class YouTubeMusicPlayer {
  constructor(apiDomain, cookies = null) {
    this.apiDomain = apiDomain;
    this.cookies = cookies;
    this.currentTrack = null;
  }
  
  async searchAndPlay(query) {
    try {
      // Search for the song
      const searchResults = await this.search(query);
      
      if (searchResults.results.length > 0) {
        const firstResult = searchResults.results[0];
        await this.playTrack(firstResult.id);
      }
    } catch (error) {
      console.error('Failed to search and play:', error);
    }
  }
  
  async search(query) {
    const params = { query, category: 'Songs' };
    if (this.cookies) params.cookies = this.cookies;
    
    const response = await fetch(`https://${this.apiDomain}/api/search?${new URLSearchParams(params)}`);
    return response.json();
  }
  
  async playTrack(videoId) {
    const params = {};
    if (this.cookies) params.cookies = this.cookies;
    
    const response = await fetch(`https://${this.apiDomain}/api/stream/${videoId}.m4a?${new URLSearchParams(params)}`);
    const blob = await response.blob();
    
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    this.currentTrack = { videoId, audio, url: audioUrl };
    audio.play();
    
    return audio;
  }
  
  stop() {
    if (this.currentTrack) {
      this.currentTrack.audio.pause();
      URL.revokeObjectURL(this.currentTrack.url);
      this.currentTrack = null;
    }
  }
}

// Usage
const player = new YouTubeMusicPlayer('your-api-domain.com', cookies);
player.searchAndPlay('despacito');
```

### Library Sync

```javascript
async function syncLibrary(cookies) {
  try {
    // Get all library sections
    const [songs, albums, artists, playlists] = await Promise.all([
      fetch(`https://your-api-domain.com/api/library/songs?cookies=${cookies}`).then(r => r.json()),
      fetch(`https://your-api-domain.com/api/library/albums?cookies=${cookies}`).then(r => r.json()),
      fetch(`https://your-api-domain.com/api/library/artists?cookies=${cookies}`).then(r => r.json()),
      fetch(`https://your-api-domain.com/api/library/playlists?cookies=${cookies}`).then(r => r.json())
    ]);
    
    // Process and store locally
    const library = {
      songs: songs.songs || [],
      albums: albums.albums || [],
      artists: artists.artists || [],
      playlists: playlists.playlists || [],
      lastSync: new Date().toISOString()
    };
    
    // Save to localStorage or database
    localStorage.setItem('youtubeMusicLibrary', JSON.stringify(library));
    
    return library;
  } catch (error) {
    console.error('Library sync failed:', error);
    throw error;
  }
}
```

## 📱 Mobile App Examples

### React Native

```javascript
// React Native example
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

const useYouTubeMusicAPI = (apiDomain, cookies = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const search = async (query, category = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { query };
      if (category) params.category = category;
      if (cookies) params.cookies = cookies;
      
      const response = await fetch(`https://${apiDomain}/api/search?${new URLSearchParams(params)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { search, loading, error };
};

// Usage in component
const MyComponent = () => {
  const { search, loading, error } = useYouTubeMusicAPI('your-api-domain.com', cookies);
  
  const handleSearch = async () => {
    try {
      const results = await search('despacito', 'Songs');
      console.log(results);
    } catch (error) {
      // Error already handled by the hook
    }
  };
  
  return (
    // Your component JSX
  );
};
```

These examples should help you get started with integrating the YouTube Music API Proxy into your applications! 