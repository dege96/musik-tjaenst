import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';

interface Song {
    id: number;
    title: string;
    genre: string;
    energy_level: 'low' | 'medium' | 'high' | 'very_high';
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
        very_high: number;
    };
}

const PlaylistContainer = styled.div`
    padding: 0 32px;
`;

const SongList = styled.div`
    display: flex;
    flex-direction: column;
`;

const HeaderRow = styled.div`
    display: grid;
    grid-template-columns: 16px 6fr 4fr 3fr minmax(120px, 1fr);
    padding: 8px 16px;
    color: #B3B3B3;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
`;

const SongRow = styled.div<{ isPlaying: boolean }>`
    display: grid;
    grid-template-columns: 16px 6fr 4fr 3fr minmax(120px, 1fr);
    padding: 8px 16px;
    color: ${props => props.isPlaying ? '#1DB954' : '#FFFFFF'};
    font-size: 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const PlayingIndicator = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
`;

const SongInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const SongThumbnail = styled.div`
    width: 40px;
    height: 40px;
    background: #282828;
    border-radius: 4px;
`;

const SongTitle = styled.div`
    font-weight: 400;
`;

const SongMeta = styled.div`
    color: #B3B3B3;
    display: flex;
    align-items: center;
`;

const Duration = styled.div`
    color: #B3B3B3;
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const EnergyBadge = styled.span<{ level: 'low' | 'medium' | 'high' | 'very_high' }>`
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
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

interface PlaylistProps {
    playlist: Playlist;
    onPlay: (songId: number) => void;
    onShuffle: () => void;
    onRepeat: () => void;
}

const PlaylistComponent: React.FC<PlaylistProps> = ({
    playlist,
    onPlay
}) => {
    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handlePlay = (song: Song) => {
        onPlay(song.id);
    };

    return (
        <PlaylistContainer>
            <HeaderRow>
                <div>#</div>
                <div>Titel</div>
                <div>Genre</div>
                <div>Energi</div>
                <Duration>Längd</Duration>
            </HeaderRow>

            <SongList>
                {playlist.songs.map((song, index) => (
                    <SongRow
                        key={song.id}
                        isPlaying={false}
                        onClick={() => handlePlay(song)}
                    >
                        <PlayingIndicator>
                            {index + 1}
                        </PlayingIndicator>
                        <SongInfo>
                            <SongThumbnail />
                            <SongTitle>{song.title}</SongTitle>
                        </SongInfo>
                        <SongMeta>{song.genre}</SongMeta>
                        <SongMeta>
                            <EnergyBadge level={song.energy_level}>
                                {song.energy_level === 'low' ? 'Låg' :
                                 song.energy_level === 'medium' ? 'Medel' : 
                                 song.energy_level === 'high' ? 'Hög' : 
                                 'Mycket hög'}
                            </EnergyBadge>
                        </SongMeta>
                        <Duration>{formatDuration(song.duration)}</Duration>
                    </SongRow>
                ))}
            </SongList>
        </PlaylistContainer>
    );
};

export default PlaylistComponent;