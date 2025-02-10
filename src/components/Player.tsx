import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';

const PlayerContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: 16px 24px;
  background: #181818;
  border-top: 1px solid #282828;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const SongInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SongImage = styled.div`
  width: 56px;
  height: 56px;
  background: #282828;
  border-radius: 4px;
`;

const SongDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const SongTitle = styled.div`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
`;

const SongArtist = styled.div`
  color: #B3B3B3;
  font-size: 12px;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ControlButton = styled.button<{ $primary?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$primary ? '#FFFFFF' : '#B3B3B3'};
  font-size: ${props => props.$primary ? '32px' : '16px'};
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: #FFFFFF;
    transform: ${props => props.$primary ? 'scale(1.1)' : 'scale(1.05)'};
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 600px;
  padding: 0 16px;
`;

const TimeDisplay = styled.div`
  color: #B3B3B3;
  font-size: 11px;
  min-width: 40px;
  text-align: center;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  flex: 1;
  height: 4px;
  background: #4f4f4f;
  border-radius: 2px;
  position: relative;
  cursor: pointer;

  &:hover {
    height: 6px;
  }

  &:hover > div {
    height: 6px;
  }

  &:hover::after {
    content: '';
    position: absolute;
    right: ${props => (100 - props.$progress)}%;
    top: 50%;
    transform: translate(50%, -50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
`;

const Progress = styled.div<{ width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #1DB954;
  border-radius: 2px;
  width: ${props => props.width}%;
  transition: width 0.1s linear;
`;

const VolumeControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
`;

const VolumeSlider = styled.input`
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: #4f4f4f;
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
`;

interface PlayerProps {
  currentSong?: {
    id: number;
    title: string;
    genre: string;
    file_url: string;
  } | null;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
  currentSong,
  onPlay,
  onPause,
  onNext,
  onPrevious 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [currentSong]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressDragStart = () => {
    setIsDragging(true);
  };

  const handleProgressDragEnd = () => {
    setIsDragging(false);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      setCurrentTime(newTime);
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  return (
    <PlayerContainer>
      <SongInfo>
        {currentSong && (
          <>
            <SongImage />
            <SongDetails>
              <SongTitle>{currentSong.title}</SongTitle>
              <SongArtist>{currentSong.genre}</SongArtist>
            </SongDetails>
          </>
        )}
      </SongInfo>

      <Controls>
        <ButtonGroup>
          <ControlButton onClick={onPrevious}>⏮</ControlButton>
          <ControlButton $primary onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </ControlButton>
          <ControlButton onClick={onNext}>⏭</ControlButton>
        </ButtonGroup>

        <ProgressContainer>
          <TimeDisplay>
            {formatTime(currentTime)}
          </TimeDisplay>
          <ProgressBar 
            onClick={handleProgressClick}
            onMouseDown={handleProgressDragStart}
            onMouseUp={handleProgressDragEnd}
            onMouseLeave={handleProgressDragEnd}
            onMouseMove={handleProgressDrag}
            $progress={(currentTime / duration) * 100 || 0}
          >
            <Progress width={(currentTime / duration) * 100 || 0} />
          </ProgressBar>
          <TimeDisplay>
            {formatTime(duration || 0)}
          </TimeDisplay>
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
        src={currentSong?.file_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </PlayerContainer>
  );
};

export default Player; 