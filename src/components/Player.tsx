import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const PlayerContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: 0 16px;
  height: 100%;
`;

const SongInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AlbumArt = styled.div`
  width: 56px;
  height: 56px;
  background: #282828;
  border-radius: 4px;
`;

const SongDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SongTitle = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
`;

const ArtistName = styled.div`
  color: #B3B3B3;
  font-size: 12px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PlayButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.04);
  }
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: #B3B3B3;
  cursor: pointer;
  font-size: 16px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #FFFFFF;
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 600px;
  padding: 0 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #4D4D4D;
  border-radius: 2px;
  position: relative;
  cursor: pointer;

  &:hover {
    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 0;
      right: 0;
      bottom: -4px;
    }
  }
`;

const Progress = styled.div<{ width: number }>`
  width: ${props => props.width}%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 2px;
  position: relative;

  &:hover {
    background: #1DB954;
  }
`;

const TimeInfo = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  color: #B3B3B3;
  font-size: 12px;
  margin-top: 4px;
`;

const VolumeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  padding-right: 16px;
`;

const VolumeSlider = styled.input`
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: #4D4D4D;
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #FFFFFF;
    border-radius: 50%;
    cursor: pointer;
  }

  &:hover {
    &::-webkit-slider-thumb {
      background: #1DB954;
    }
  }
`;

const Player: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <PlayerContainer>
      <SongInfo>
        <AlbumArt />
        <SongDetails>
          <SongTitle>Song Title</SongTitle>
          <ArtistName>Artist Name</ArtistName>
        </SongDetails>
      </SongInfo>

      <Controls>
        <ButtonGroup>
          <ControlButton>⟲</ControlButton>
          <ControlButton>⏮</ControlButton>
          <PlayButton onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </PlayButton>
          <ControlButton>⏭</ControlButton>
          <ControlButton>⟳</ControlButton>
        </ButtonGroup>
        <ProgressContainer>
          <ProgressBar>
            <Progress width={30} />
          </ProgressBar>
          <TimeInfo>
            <span>1:23</span>
            <span>3:45</span>
          </TimeInfo>
        </ProgressContainer>
      </Controls>

      <VolumeControls>
        <ControlButton>🔊</ControlButton>
        <VolumeSlider
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
        />
      </VolumeControls>

      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const currentTime = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            setProgress((currentTime / duration) * 100);
          }
        }}
      />
    </PlayerContainer>
  );
};

export default Player; 