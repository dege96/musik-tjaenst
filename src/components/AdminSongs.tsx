import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

interface Song {
    id: number;
    title: string;
    artist: string;
    duration: number;
    energy_level: 'low' | 'medium' | 'high';
    file_url: string;
    is_active: boolean;
}

const Container = styled.div`
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
    font-size: 24px;
    color: #1a1a1a;
    margin-bottom: 24px;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
`;

const Th = styled.th`
    text-align: left;
    padding: 12px;
    border-bottom: 2px solid #f0f0f0;
    color: #666;
    font-weight: 500;
`;

const Td = styled.td`
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
`;

const ActionButton = styled.button<{ variant?: 'danger' }>`
    background: ${props => props.variant === 'danger' ? '#dc3545' : '#007AFF'};
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    margin-right: 8px;

    &:hover {
        background: ${props => props.variant === 'danger' ? '#c82333' : '#0056b3'};
    }
`;

const StatusBadge = styled.span<{ active: boolean }>`
    background: ${props => props.active ? '#28a745' : '#dc3545'};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
`;

const EnergyBadge = styled.span<{ level: 'low' | 'medium' | 'high' }>`
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    background: ${props => {
        switch (props.level) {
            case 'low': return '#E3F2FD';
            case 'medium': return '#FFF3E0';
            case 'high': return '#FFEBEE';
        }
    }};
    color: ${props => {
        switch (props.level) {
            case 'low': return '#1976D2';
            case 'medium': return '#F57C00';
            case 'high': return '#D32F2F';
        }
    }};
`;

const EditModal = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ModalContent = styled.div`
    background: white;
    padding: 24px;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
`;

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    color: #666;
`;

const Input = styled.input`
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
`;

const Select = styled.select`
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
`;

const AdminSongs: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSongs = async () => {
        try {
            const response = await axios.get('/api/songs');
            setSongs(response.data);
        } catch (error) {
            console.error('Kunde inte hämta låtar:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSongs();
    }, []);

    const handleEdit = (song: Song) => {
        setEditingSong(song);
    };

    const handleUpdate = async () => {
        if (!editingSong) return;

        try {
            await axios.put(`/api/songs/${editingSong.id}`, editingSong);
            setEditingSong(null);
            fetchSongs();
        } catch (error) {
            console.error('Kunde inte uppdatera låt:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Är du säker på att du vill ta bort denna låt?')) return;

        try {
            await axios.delete(`/api/songs/${id}`);
            fetchSongs();
        } catch (error) {
            console.error('Kunde inte ta bort låt:', error);
        }
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Container>
            <Title>Hantera låtar</Title>
            {loading ? (
                <p>Laddar...</p>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <Th>Titel</Th>
                            <Th>Artist</Th>
                            <Th>Längd</Th>
                            <Th>Energinivå</Th>
                            <Th>Status</Th>
                            <Th>Åtgärder</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.map(song => (
                            <tr key={song.id}>
                                <Td>{song.title}</Td>
                                <Td>{song.artist}</Td>
                                <Td>{formatDuration(song.duration)}</Td>
                                <Td>
                                    <EnergyBadge level={song.energy_level}>
                                        {song.energy_level === 'low' ? 'Låg' :
                                         song.energy_level === 'medium' ? 'Medel' : 'Hög'}
                                    </EnergyBadge>
                                </Td>
                                <Td>
                                    <StatusBadge active={song.is_active}>
                                        {song.is_active ? 'Aktiv' : 'Inaktiv'}
                                    </StatusBadge>
                                </Td>
                                <Td>
                                    <ActionButton onClick={() => handleEdit(song)}>
                                        Redigera
                                    </ActionButton>
                                    <ActionButton 
                                        variant="danger"
                                        onClick={() => handleDelete(song.id)}
                                    >
                                        Ta bort
                                    </ActionButton>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {editingSong && (
                <EditModal onClick={() => setEditingSong(null)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <Title>Redigera låt</Title>
                        <FormGroup>
                            <Label>Titel</Label>
                            <Input
                                type="text"
                                value={editingSong.title}
                                onChange={e => setEditingSong({
                                    ...editingSong,
                                    title: e.target.value
                                })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Artist</Label>
                            <Input
                                type="text"
                                value={editingSong.artist}
                                onChange={e => setEditingSong({
                                    ...editingSong,
                                    artist: e.target.value
                                })}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label>Energinivå</Label>
                            <Select
                                value={editingSong.energy_level}
                                onChange={e => setEditingSong({
                                    ...editingSong,
                                    energy_level: e.target.value as 'low' | 'medium' | 'high'
                                })}
                            >
                                <option value="low">Låg</option>
                                <option value="medium">Medel</option>
                                <option value="high">Hög</option>
                            </Select>
                        </FormGroup>
                        <FormGroup>
                            <Label>Status</Label>
                            <Select
                                value={editingSong.is_active.toString()}
                                onChange={e => setEditingSong({
                                    ...editingSong,
                                    is_active: e.target.value === 'true'
                                })}
                            >
                                <option value="true">Aktiv</option>
                                <option value="false">Inaktiv</option>
                            </Select>
                        </FormGroup>
                        <ActionButton onClick={handleUpdate}>
                            Spara ändringar
                        </ActionButton>
                        <ActionButton 
                            variant="danger" 
                            onClick={() => setEditingSong(null)}
                        >
                            Avbryt
                        </ActionButton>
                    </ModalContent>
                </EditModal>
            )}
        </Container>
    );
};

export default AdminSongs; 