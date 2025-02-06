import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const UploadContainer = styled.div`
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
    font-size: 24px;
    color: #1a1a1a;
    margin-bottom: 24px;
`;

const UploadForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const FileInput = styled.input`
    display: none;
`;

const FileButton = styled.button`
    background: #007AFF;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
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

const SelectedFile = styled.div`
    padding: 12px;
    background: #f8f8f8;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
`;

const EnergySelect = styled.select`
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    width: 200px;
`;

const ProgressBar = styled.div<{ progress: number }>`
    width: 100%;
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;

    &::after {
        content: '';
        display: block;
        width: ${props => props.progress}%;
        height: 100%;
        background: #007AFF;
        transition: width 0.3s ease;
    }
`;

const ErrorMessage = styled.div`
    color: #d32f2f;
    font-size: 14px;
    padding: 8px 0;
`;

const SuccessMessage = styled.div`
    color: #2e7d32;
    font-size: 14px;
    padding: 8px 0;
`;

const AdminUpload: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'audio/mpeg' && file.type !== 'audio/mp3') {
                setError('Endast MP3-filer är tillåtna');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB
                setError('Filen är för stor (max 10MB)');
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('energy_level', energyLevel);

        try {
            setError(null);
            setSuccess(null);
            setUploadProgress(0);

            await axios.post('/api/songs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(progress);
                },
            });

            setSuccess('Låten har laddats upp!');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setUploadProgress(0);
        } catch (err) {
            setError('Kunde inte ladda upp filen. Försök igen.');
            console.error('Uppladdningsfel:', err);
        }
    };

    return (
        <UploadContainer>
            <Title>Ladda upp MP3-fil</Title>
            <UploadForm onSubmit={handleUpload}>
                <FileInput
                    type="file"
                    accept=".mp3,audio/mpeg"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                />
                <FileButton
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Välj MP3-fil
                </FileButton>

                {selectedFile && (
                    <SelectedFile>
                        Vald fil: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </SelectedFile>
                )}

                <EnergySelect
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(e.target.value as 'low' | 'medium' | 'high')}
                >
                    <option value="low">Låg energi</option>
                    <option value="medium">Medel energi</option>
                    <option value="high">Hög energi</option>
                </EnergySelect>

                {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />}

                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}

                <FileButton
                    type="submit"
                    disabled={!selectedFile || uploadProgress > 0}
                >
                    {uploadProgress > 0 ? 'Laddar upp...' : 'Ladda upp'}
                </FileButton>
            </UploadForm>
        </UploadContainer>
    );
};

export default AdminUpload; 