import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  padding: 24px;
  color: #FFFFFF;
`;

const Section = styled.section`
  margin-bottom: 48px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #FFFFFF;
`;

const ShowAll = styled.a`
  color: #B3B3B3;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #FFFFFF;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 24px;
`;

const Card = styled.div`
  background: #181818;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.3s;
  position: relative;
  aspect-ratio: 1;

  &:hover {
    background: #282828;
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: #282828;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 16px;
`;

const CardTitle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
`;

const areas = [
  { id: 1, name: 'Gym' },
  { id: 2, name: 'Bar' },
  { id: 3, name: 'Party' },
  { id: 4, name: 'Spa' },
  { id: 5, name: 'Cafe' }

];

const energyLevels = [
  { id: 1, name: 'Very high' },
  { id: 2, name: 'High' },
  { id: 3, name: 'Medium' },
  { id: 4, name: 'Low' },
];

const OfficialPlaylists: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (type: string, value: string) => {
    const businessType = value.toLowerCase().replace(/\s+/g, '_');
    navigate(`/playlists/${businessType}`);
  };

  return (
    <Container>
      <Section>
        <SectionHeader>
          <Title>Area</Title>
          <ShowAll href="/areas">Show all</ShowAll>
        </SectionHeader>
        <Grid>
          {areas.map(area => (
            <Card key={area.id} onClick={() => handleCardClick('area', area.name)}>
              <ImagePlaceholder>&lt;image&gt;</ImagePlaceholder>
              <CardTitle>{area.name}</CardTitle>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section>
        <SectionHeader>
          <Title>Energy level</Title>
        </SectionHeader>
        <Grid>
          {energyLevels.map(level => (
            <Card key={level.id} onClick={() => handleCardClick('energy', level.name)}>
              <ImagePlaceholder>&lt;image&gt;</ImagePlaceholder>
              <CardTitle>{level.name}</CardTitle>
            </Card>
          ))}
        </Grid>
      </Section>
    </Container>
  );
};

export default OfficialPlaylists; 