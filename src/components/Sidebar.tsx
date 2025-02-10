import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Calendar, 
  PlusSquare, 
  Music,
  Briefcase,
  Coffee,
  Activity,
  Sun,
  List
} from 'react-feather';

const SidebarContainer = styled.div`
  background: #000000;
  width: 240px;
  height: 100%;
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  margin-bottom: 32px;
  padding: 0 12px;

  img {
    width: 180px;
    height: auto;
  }
`;

const NavSection = styled.div`
  margin-bottom: 24px;
`;

interface NavItemProps {
  $active?: boolean;
}

const NavItem = styled(Link)<NavItemProps>`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => props.$active ? '#FFFFFF' : '#B3B3B3'};
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.2s;

  &:hover {
    color: #FFFFFF;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CreatePlaylistButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #B3B3B3;
  padding: 8px 12px;
  width: 100%;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #FFFFFF;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #282828;
  margin: 8px 0;
`;

const PlaylistsSection = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-top: 8px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #666666;
    border-radius: 4px;
  }
`;

const PlaylistTitle = styled.h2`
  opacity: 0.5;
  color: #B3B3B3;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  margin-bottom: 8px;
`;

const PlaylistItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #B3B3B3;
  text-decoration: none;
  padding: 8px 12px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    color: #FFFFFF;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

interface Playlist {
  id: number;
  name: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const playlists: Playlist[] = [
    { id: 1, name: 'Gym', icon: <Activity size={16} /> },
    { id: 2, name: 'Office', icon: <Briefcase size={16} /> },
    { id: 3, name: 'Party', icon: <Music size={16} /> },
    { id: 4, name: 'Spa', icon: <Sun size={16} /> },
    { id: 5, name: 'Café', icon: <Coffee size={16} /> },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <img src="/images/logo.png" alt="Atmo Studio" />
      </Logo>
      
      <NavSection>
        <NavItem to="/official-playlists" $active={location.pathname === '/official-playlists'}>
          <List size={20} />
          Official Playlists
        </NavItem>

        <NavItem to="/discover" $active={location.pathname === '/discover'}>
          <Compass size={20} />
          Discover
        </NavItem>

        <NavItem to="/schedule" $active={location.pathname === '/schedule'}>
          <Calendar size={20} />
          Schedule
        </NavItem>
      </NavSection>

      <NavSection>
        <CreatePlaylistButton>
          <PlusSquare size={20} />
          Create Playlist
        </CreatePlaylistButton>
      </NavSection>

      <Divider />

      <PlaylistsSection>
        <PlaylistTitle>Your Playlists</PlaylistTitle>
        {playlists.map(playlist => (
          <PlaylistItem 
            key={playlist.id} 
            to={`/playlists/${playlist.name.toLowerCase().replace(/é/g, 'e')}`}
          >
            {playlist.icon}
            {playlist.name}
          </PlaylistItem>
        ))}
      </PlaylistsSection>
    </SidebarContainer>
  );
};

export default Sidebar; 