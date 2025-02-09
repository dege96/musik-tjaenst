import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import PlaylistComponent from './Playlist';
import { API_BASE_URL } from '../config';
import { useLocation } from 'react-router-dom';
import { Play, Shuffle, Download, Repeat, Share2, MoreHorizontal } from 'react-feather';


interface Song {
    id: number;
    title: string;
    genre: string;
    energy_level: 'low' | 'medium' | 'high' | 'very_high';
    duration: number;
    file_url: string;
    is_active: boolean;
}

interface GenrePlaylist {
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

interface ControlButtonProps {
    active?: boolean;
}

const Container = styled.div`
    padding: 24px;
    color: #FFFFFF;
`;

const Header = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 24px;
    margin-bottom: 24px;
    padding: 24px;
`;

const PlaylistImage = styled.div`
    width: 232px;
    height: 232px;
    background: linear-gradient(135deg, #450af5, #c4efd9);
    border-radius: 4px;
    box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
`;

const PlaylistInfo = styled.div`
    flex: 1;
`;

const PlaylistType = styled.div`
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 8px;
`;

const PlaylistTitle = styled.h1`
    font-size: 96px;
    font-weight: 900;
    margin: 0;
    line-height: 96px;
    padding-bottom: 8px;
`;

const PlaylistStats = styled.div`
    color: #B3B3B3;
    font-size: 14px;
    margin-top: 8px;
`;

const PlaylistControls = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    margin: 24px 0;
    padding: 0 24px;
`;

const PlayButton = styled.button`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #1DB954;
    border: none;
    color: #FFFFFF;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, background-color 0.2s;

    &:hover {
        transform: scale(1.04);
        background: #1ed760;
    }
`;

const ControlButton = styled.button<ControlButtonProps>`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: ${props => props.active ? '#1DB954' : '#B3B3B3'};
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
        color: #FFFFFF;
        transform: scale(1.04);
    }
`;

const MoreButton = styled(ControlButton)`
    position: relative;
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: #282828;
    border-radius: 4px;
    padding: 4px;
    min-width: 160px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    z-index: 1000;
`;

const MenuItem = styled.button`
    width: 100%;
    padding: 12px 16px;
    background: none;
    border: none;
    color: #B3B3B3;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.2s;

    &:hover {
        color: #FFFFFF;
        background: rgba(255, 255, 255, 0.1);
    }
`;

const ErrorMessage = styled.div`
    color: #dc3545;
    padding: 16px;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 8px;
    margin-bottom: 16px;
`;

const LoadingMessage = styled.div`
    padding: 16px;
    color: #FFFFFF;
    font-size: 14px;
`;

const GenrePlaylists: React.FC = () => {
    const [playlists, setPlaylists] = useState<GenrePlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isShuffleOn, setIsShuffleOn] = useState(false);
    const [isRepeatOn, setIsRepeatOn] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const filterType = searchParams.get('type') || '';
    const filterValue = searchParams.get('value') || '';

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${API_BASE_URL}/api/songs`, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const songs: Song[] = response.data;

                // Gruppera låtar efter genre
                const songsByGenre = songs.reduce((acc, song) => {
                    if (!acc[song.genre]) {
                        acc[song.genre] = [];
                    }
                    acc[song.genre].push({
                        ...song,
                        file_url: song.file_url.startsWith('http') 
                            ? song.file_url 
                            : `https://d3ay0m1fmlct6z.cloudfront.net${song.file_url}`
                    });
                    return acc;
                }, {} as Record<string, Song[]>);

                // Skapa spellistor för varje genre
                const genrePlaylists = Object.entries(songsByGenre)
                    .filter(([_, songs]) => songs.length > 0)
                    .map(([genre, songs], index) => ({
                        id: index + 1,
                        name: genre,
                        songs: songs.filter(song => song.is_active),
                        energy_profile: {
                            low: songs.filter(s => s.energy_level === 'low').length,
                            medium: songs.filter(s => s.energy_level === 'medium').length,
                            high: songs.filter(s => s.energy_level === 'high').length,
                            very_high: songs.filter(s => s.energy_level === 'very_high').length
                        }
                    }));

                setPlaylists(genrePlaylists);
                setLoading(false);
            } catch (error) {
                console.error('Kunde inte hämta låtar:', error);
                setError('Kunde inte ladda låtarna. Försök igen senare.');
                setLoading(false);
            }
        };

        fetchSongs();
    }, []);

    const handlePlay = (songId: number) => {
        console.log('Spelar låt:', songId);
    };

    const handleShuffle = () => {
        setIsShuffleOn(!isShuffleOn);
        console.log('Shuffle:', !isShuffleOn);
    };

    const handleRepeat = () => {
        setIsRepeatOn(!isRepeatOn);
        console.log('Repeat:', !isRepeatOn);
    };

    const handleDownload = () => {
        console.log('Laddar ner spellista för offline-uppspelning');
    };

    const handleShare = () => {
        const playlistUrl = window.location.href;
        navigator.clipboard.writeText(playlistUrl)
            .then(() => alert('Länk kopierad till urklipp!'))
            .catch(err => console.error('Kunde inte kopiera länk:', err));
        setShowDropdown(false);
    };

    if (loading) {
        return <LoadingMessage>Laddar spellistor...</LoadingMessage>;
    }

    if (error) {
        return <ErrorMessage>{error}</ErrorMessage>;
    }

    if (playlists.length === 0) {
        return <ErrorMessage>Inga spellistor hittades.</ErrorMessage>;
    }

    const playlist = playlists[0]; // För demo, visa första spellistan

    return (
        <Container>
            <Header>
                <PlaylistImage />
                <PlaylistInfo>
                    <PlaylistType>Spellista</PlaylistType>
                    <PlaylistTitle>{playlist.name}</PlaylistTitle>
                    <PlaylistStats>
                        {playlist.songs.length} låtar • {Math.floor(playlist.songs.reduce((acc, song) => acc + song.duration, 0) / 60)} min
                    </PlaylistStats>
                </PlaylistInfo>
            </Header>


            <PlaylistControls>
                <PlayButton><Play /></PlayButton>
                <ControlButton 
                    onClick={handleShuffle}
                    active={isShuffleOn}
                    title="Blanda"
                >
                    <Shuffle />
                </ControlButton>
                <ControlButton 
                    onClick={handleRepeat}
                    active={isRepeatOn}
                    title="Upprepa"
                >
                    <Repeat />
                </ControlButton>
                <ControlButton 
                    onClick={handleDownload}
                    title="Ladda ner för offline"
                >
                    <Download />
                </ControlButton>
                <MoreButton 
                    onClick={() => setShowDropdown(!showDropdown)}
                    title="Mer"
                >
                    <MoreHorizontal />
                    {showDropdown && (
                        <DropdownMenu>
                            <MenuItem onClick={handleShare}>
                                <Share2 />
                                Dela spellista
                            </MenuItem>
                        </DropdownMenu>
                    )}
                </MoreButton>
            </PlaylistControls>

            <PlaylistComponent
                playlist={playlist}
                onPlay={handlePlay}
                onShuffle={handleShuffle}
                onRepeat={handleRepeat}
            />
        </Container>
    );
};

export default GenrePlaylists; 