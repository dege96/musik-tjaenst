import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { Search } from 'react-feather';
import OfficialPlaylists from './components/OfficialPlaylists';
import GenrePlaylists from './components/GenrePlaylists';
import Discover from './components/Discover';
import Player from './components/Player';
import Sidebar from './components/Sidebar';

const AppContainer = styled.div`
  display: grid;
  grid-template-areas:
    "sidebar main"
    "player player";
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr auto;
  height: 100vh;
  background: #000000;
  color: #FFFFFF;
`;

const MainContent = styled.main`
  grid-area: main;
  background: linear-gradient(to bottom, #1F1F1F, #121212);
  overflow-y: auto;
  position: relative;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  position: sticky;
  top: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  z-index: 100;
`;

const SearchBar = styled.div`
  position: relative;
  width: 364px;

  input {
    width: 100%;
    padding: 12px 40px;
    border-radius: 500px;
    border: none;
    background: #242424;
    color: #FFFFFF;
    font-size: 14px;

    &::placeholder {
      color: #B3B3B3;
    }

    &:focus {
      outline: none;
      background: #2A2A2A;
    }
  }

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #B3B3B3;
    width: 20px;
    height: 20px;
  }
`;

const UserControls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const NavButton = styled.a`
  color: #B3B3B3;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: color 0.2s;

  &:hover {
    color: #FFFFFF;
  }
`;

const SignUpButton = styled.button`
  background: #FFFFFF;
  color: #000000;
  border: none;
  padding: 8px 32px;
  border-radius: 500px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.04);
  }
`;

const LogInButton = styled(SignUpButton)`
  background: #1DB954;
  color: #FFFFFF;
`;

const PlayerWrapper = styled.div`
  grid-area: player;
  background: #181818;
  border-top: 1px solid #282828;
  height: 90px;
`;

const App: React.FC = () => {
  const isAdmin = true; // Temporärt för utveckling

  return (
    <Router>
      <AppContainer>
        <Sidebar />

        <MainContent>
          <TopBar>
            <SearchBar>
              <input placeholder="Vad vill du lyssna på?" />
              <Search />
            </SearchBar>
            <UserControls>
              <NavButton href="/premium">Premium</NavButton>
              <NavButton href="/support">Support</NavButton>
              <NavButton href="/download">Download</NavButton>
              <SignUpButton>Sign up</SignUpButton>
              <LogInButton>Log in</LogInButton>
            </UserControls>
          </TopBar>

          <Routes>
            <Route path="/" element={<OfficialPlaylists />} />
            <Route path="/official-playlists" element={<OfficialPlaylists />} />
            <Route path="/discover" element={<Discover />} />
            {/* <Route path="/schedule" element={<Schedule />} /> */}
            <Route path="/playlists" element={<GenrePlaylists />} />
            {/* {isAdmin && (
              <Route path="/admin/songs" element={<AdminSongs />} />
            )} */}
          </Routes>
        </MainContent>

        <PlayerWrapper>
          <Player />
        </PlayerWrapper>
      </AppContainer>
    </Router>
  );
};

export default App; 