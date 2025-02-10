import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Play, Shuffle, Download, Share2, MoreHorizontal, Search, Clock } from 'react-feather';
import { API_BASE_URL } from '../config';

const Container = styled.div`
  padding: 24px;
  color: #FFFFFF;
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: #B3B3B3;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #FFFFFF;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 50px 3fr 1fr 1fr 1fr 80px;
  padding: 0 16px;
  height: 36px;
  align-items: center;
  border-bottom: 1px solid #282828;
  color: #B3B3B3;
  font-size: 14px;
  position: sticky;
  top: 0;
  background: #121212;
  z-index: 1;
`;

const SortButton = styled.button`
  background: none;
  border: none;
  color: #B3B3B3;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: #FFFFFF;
  }
`;

const SongList = styled.div`
  margin-top: 8px;
`;

const SongRow = styled.div`
  display: grid;
  grid-template-columns: 50px 3fr 1fr 1fr 1fr 80px;
  padding: 8px 16px;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #282828;
  }
`;

const SongNumber = styled.span`
  color: #B3B3B3;
`;

const SongInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SongImage = styled.div`
  width: 40px;
  height: 40px;
  background: #282828;
  border-radius: 4px;
`;

const SongTitle = styled.div`
  font-weight: 500;
`;

const SongArtist = styled.div`
  color: #B3B3B3;
  font-size: 14px;
`;

const EnergyBadge = styled.span<{ level: 'low' | 'medium' | 'high' | 'very_high' }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  width: fit-content;
  background: ${props => {
    switch (props.level) {
      case 'low': return 'rgba(29, 185, 84, 0.1)';
      case 'medium': return 'rgba(255, 167, 38, 0.1)';
      case 'high': return 'rgba(255, 23, 68, 0.1)';
      case 'very_high': return 'rgba(156, 39, 176, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.level) {
      case 'low': return '#1DB954';
      case 'medium': return '#FFA726';
      case 'high': return '#FF1744';
      case 'very_high': return '#9C27B0';
    }
  }};
`;

interface Song {
  id: number;
  title: string;
  genre: string;
  energy_level: 'low' | 'medium' | 'high' | 'very_high';
  duration: number;
  file_url: string;
  is_active: boolean;
}

interface DiscoverProps {
  onPlaySong: (song: Song) => void;
  currentlyPlaying: number | null;
}

const Discover: React.FC<DiscoverProps> = ({ onPlaySong, currentlyPlaying }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEnergyLevelText = (level: 'low' | 'medium' | 'high' | 'very_high'): string => {
    switch (level) {
      case 'low': return 'Låg';
      case 'medium': return 'Medel';
      case 'high': return 'Hög';
      case 'very_high': return 'Mycket hög';
    }
  };

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/songs`);
      
      if (!response.ok) {
        throw new Error('Kunde inte hämta låtar');
      }
      
      const data = await response.json();
      // Säkerställ att alla låtar har kompletta URL:er
      const songsWithFullUrls = data.map((song: Song) => ({
        ...song,
        file_url: song.file_url.startsWith('http') 
          ? song.file_url 
          : `https://d3ay0m1fmlct6z.cloudfront.net${song.file_url}`
      }));
      setSongs(songsWithFullUrls);
      setLoading(false);
    } catch (error) {
      console.error('Fel vid hämtning av låtar:', error);
      setError('Kunde inte hämta låtar. Försök igen senare.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handlePlay = (song: Song) => {
    onPlaySong(song);
  };

  return (
    <Container>
      <Controls>
        <ControlButton><Play /></ControlButton>
        <ControlButton><Shuffle /></ControlButton>
        <ControlButton><Download /></ControlButton>
        <ControlButton><Share2 /></ControlButton>
        <ControlButton><MoreHorizontal /></ControlButton>
      </Controls>

      {error && <div style={{ color: '#ff4444', padding: '16px' }}>{error}</div>}

      <TableHeader>
        <span>#</span>
        <SortButton>Titel</SortButton>
        <SortButton>Genre</SortButton>
        <SortButton>Energi</SortButton>
        <SortButton>Längd</SortButton>
        <SortButton><Clock size={16} /></SortButton>
      </TableHeader>

      <SongList>
        {songs.map((song, index) => (
          <SongRow key={song.id} onClick={() => handlePlay(song)}>
            <SongNumber>{currentlyPlaying === song.id ? '▶' : (index + 1)}</SongNumber>
            <SongInfo>
              <SongImage />
              <div>
                <SongTitle>{song.title}</SongTitle>
                <SongArtist>{song.genre}</SongArtist>
              </div>
            </SongInfo>
            <span>{song.genre}</span>
            <EnergyBadge level={song.energy_level}>
              {getEnergyLevelText(song.energy_level)}
            </EnergyBadge>
            <span>{formatDuration(song.duration)}</span>
            <span></span>
          </SongRow>
        ))}
        {loading && <div style={{ padding: '16px', color: '#B3B3B3' }}>Laddar låtar...</div>}
      </SongList>
    </Container>
  );
};

export default Discover; 