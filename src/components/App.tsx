import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import GenrePlaylists from './GenrePlaylists';
import AdminUpload from './AdminUpload';
import AdminSongs from './AdminSongs';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f7;
  padding: 24px;
`;

const Header = styled.header`
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  border-radius: 12px;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #1a1a1a;
  margin: 0;
`;

const Navigation = styled.nav`
  margin-top: 16px;
  display: flex;
  gap: 16px;
`;

const NavLink = styled.a`
  color: #007AFF;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 0;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: #007AFF;
    transform: scaleX(0);
    transition: transform 0.2s;
  }

  &:hover:after {
    transform: scaleX(1);
  }
`;

const App: React.FC = () => {
  // TODO: Implementera faktisk autentisering
  const isAdmin = true; // Temporärt för utveckling

  return (
    <Router>
      <AppContainer>
        <Header>
          <Title>Musiktjänst för Företag</Title>
          <Navigation>
            <NavLink href="/playlists">Spellistor</NavLink>
            {isAdmin && (
              <>
                <NavLink href="/admin/upload">Ladda upp musik</NavLink>
                <NavLink href="/admin/songs">Hantera låtar</NavLink>
              </>
            )}
            <NavLink href="/settings">Inställningar</NavLink>
            <NavLink href="/subscription">Prenumeration</NavLink>
          </Navigation>
        </Header>

        <Routes>
          <Route path="/playlists" element={<GenrePlaylists />} />
          {isAdmin && (
            <>
              <Route path="/admin/upload" element={<AdminUpload />} />
              <Route path="/admin/songs" element={<AdminSongs />} />
            </>
          )}
          <Route path="/" element={<Navigate to="/playlists" replace />} />
        </Routes>
      </AppContainer>
    </Router>
  );
};

export default App; 