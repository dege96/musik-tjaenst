import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import PlaylistComponent from './Playlist';
import { API_BASE_URL } from '../config';

interface Song {
    id: number;
    title: string;
    genre: string;
    energy_level: 'low' | 'medium' | 'high';
    duration: number;
    file_url: string;
}

interface GenrePlaylist {
    id: number;
    name: string;
    songs: Song[];
    energy_profile: {
        low: number;
        medium: number;
        high: number;
    };
}

const Container = styled.div`
    padding: 24px;
`;

const GenreSection = styled.div`
    margin-bottom: 48px;
`;

const GenreTitle = styled.h2`
    font-size: 28px;
    color: #1a1a1a;
    margin-bottom: 24px;
`;

const GenrePlaylists: React.FC = () => {
    const [playlists, setPlaylists] = useState<GenrePlaylist[]>([]);

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/songs`);
                const songs: Song[] = response.data;

                // Gruppera låtar efter genre
                const songsByGenre = songs.reduce((acc, song) => {
                    if (!acc[song.genre]) {
                        acc[song.genre] = [];
                    }
                    acc[song.genre].push(song);
                    return acc;
                }, {} as Record<string, Song[]>);

                // Skapa spellistor för varje genre
                const genrePlaylists = Object.entries(songsByGenre).map(([genre, songs], index) => ({
                    id: index + 1, // Generera ett unikt ID för varje spellista
                    name: genre,
                    songs,
                    energy_profile: {
                        low: songs.filter(s => s.energy_level === 'low').length,
                        medium: songs.filter(s => s.energy_level === 'medium').length,
                        high: songs.filter(s => s.energy_level === 'high').length
                    }
                }));

                setPlaylists(genrePlaylists);
            } catch (error) {
                console.error('Kunde inte hämta låtar:', error);
            }
        };

        fetchSongs();
    }, []);

    const handlePlay = (songId: number) => {
        console.log('Spelar låt:', songId);
    };

    const handleShuffle = () => {
        console.log('Blandar spellista');
    };

    const handleRepeat = () => {
        console.log('Upprepar spellista');
    };

    return (
        <Container>
            {playlists.map(playlist => (
                <GenreSection key={playlist.name}>
                    <GenreTitle>{playlist.name}</GenreTitle>
                    <PlaylistComponent
                        playlist={playlist}
                        onPlay={handlePlay}
                        onShuffle={handleShuffle}
                        onRepeat={handleRepeat}
                    />
                </GenreSection>
            ))}
        </Container>
    );
};

export default GenrePlaylists; 