import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';

interface Song {
    id: number;
    title: string;
    genre: string;
    energy_level: 'low' | 'medium' | 'high';
    duration: number;
    file_url: string;
}

interface Playlist {
    id: number;
    name: string;
    songs: Song[];
    energy_profile: {
        low: number;
        medium: number;
        high: number;
    };
}

const PlaylistContainer = styled.div`
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    max-width: 800px;
    margin: 0 auto;
`;

const PlaylistHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const PlaylistTitle = styled.h2`
    font-size: 24px;
    font-weight: 500;
    color: #1a1a1a;
    margin: 0;
`;

const Controls = styled.div`
    display: flex;
    gap: 16px;
`;

const Button = styled.button`
    background: #007AFF;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #0055FF;
    }

    &:disabled {
        background: #cccccc;
        cursor: not-allowed;
    }
`;

const SongList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const SongItem = styled.div<{ isPlaying: boolean }>`
    display: flex;
    align-items: center;
    padding: 12px;
    background: ${props => props.isPlaying ? '#f0f7ff' : '#f8f8f8'};
    border-radius: 8px;
    transition: background 0.2s;

    &:hover {
        background: #f0f0f0;
    }
`;

const SongTitle = styled.span`
    flex: 1;
    font-size: 16px;
    color: #333333;
`;

const GenreBadge = styled.span`
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: #E8F5E9;
    color: #2E7D32;
    margin-right: 12px;
`;

const EnergyBadge = styled.span<{ level: 'low' | 'medium' | 'high' }>`
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: ${props => {
        switch (props.level) {
            case 'low': return '#E3F2FD';
            case 'medium': return '#FFF3E0';
            case 'high': return '#FFEBEE';
            default: return '#E0E0E0';
        }
    }};
    color: ${props => {
        switch (props.level) {
            case 'low': return '#1976D2';
            case 'medium': return '#F57C00';
            case 'high': return '#D32F2F';
            default: return '#757575';
        }
    }};
    margin-left: 12px;
`;

const Duration = styled.span`
    font-size: 14px;
    color: #666666;
    margin-left: 12px;
`;

const AudioPlayer = styled.audio`
    width: 100%;
    margin-top: 16px;
`;

interface PlaylistProps {
    playlist: Playlist;
    onPlay: (songId: number) => void;
    onShuffle: () => void;
    onRepeat: () => void;
}

const PlaylistComponent: React.FC<PlaylistProps> = ({
    playlist,
    onPlay,
    onShuffle,
    onRepeat
}) => {
    const [currentSong, setCurrentSong] = useState<number | null>(null);
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [isRepeatOn, setIsRepeatOn] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handlePlay = (song: Song) => {
        setCurrentSong(song.id);
        if (audioRef.current) {
            try {
                const audioUrl = `${API_BASE_URL}${song.file_url}`;
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch(error => {
                    console.error('Kunde inte spela låten:', error);
                    setCurrentSong(null);
                });
            } catch (error) {
                console.error('Fel vid uppspelning:', error);
                setCurrentSong(null);
            }
        }
        onPlay(song.id);
    };

    const handleShuffle = () => {
        setIsShuffleOn(!isShuffleOn);
        onShuffle();
    };

    const handleRepeat = () => {
        setIsRepeatOn(!isRepeatOn);
        onRepeat();
    };

    return (
        <PlaylistContainer>
            <PlaylistHeader>
                <PlaylistTitle>{playlist.name}</PlaylistTitle>
                <Controls>
                    <Button onClick={handleShuffle}>
                        {isShuffleOn ? 'Blanda av' : 'Blanda'}
                    </Button>
                    <Button onClick={handleRepeat}>
                        {isRepeatOn ? 'Upprepa av' : 'Upprepa'}
                    </Button>
                </Controls>
            </PlaylistHeader>
            <SongList>
                {playlist.songs.map(song => (
                    <SongItem
                        key={song.id}
                        isPlaying={currentSong === song.id}
                        onClick={() => handlePlay(song)}
                    >
                        <SongTitle>{song.title}</SongTitle>
                        <GenreBadge>{song.genre}</GenreBadge>
                        <EnergyBadge level={song.energy_level}>
                            {song.energy_level === 'low' ? 'Låg' :
                             song.energy_level === 'medium' ? 'Medel' : 'Hög'} energi
                        </EnergyBadge>
                        <Duration>{formatDuration(song.duration)}</Duration>
                    </SongItem>
                ))}
            </SongList>
            <AudioPlayer 
                ref={audioRef}
                controls
                onEnded={() => {
                    if (isRepeatOn && audioRef.current) {
                        audioRef.current.play().catch(console.error);
                    } else {
                        setCurrentSong(null);
                    }
                }}
                onError={(e) => {
                    console.error('Ljuduppspelningsfel:', e);
                    setCurrentSong(null);
                }}
            />
        </PlaylistContainer>
    );
};

export default PlaylistComponent; 