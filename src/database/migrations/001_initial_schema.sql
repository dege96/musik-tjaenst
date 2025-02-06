-- Användartyper
CREATE TYPE user_role AS ENUM ('admin', 'business');
CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE business_type AS ENUM ('gym', 'cafe', 'retail', 'restaurant', 'office', 'other');

-- Användartabell (Företag)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    org_number VARCHAR(20) UNIQUE NOT NULL,
    business_type business_type NOT NULL,
    role user_role NOT NULL DEFAULT 'business',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subscription_status BOOLEAN DEFAULT false,
    subscription_expires_at TIMESTAMP WITH TIME ZONE
);

-- Låtar
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    energy_level energy_level NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Företagsanpassade spellistor
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    business_type business_type NOT NULL,
    energy_profile JSON NOT NULL, -- För att spara energifördelning
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spellistans låtar
CREATE TABLE playlist_songs (
    playlist_id INTEGER REFERENCES playlists(id),
    song_id INTEGER REFERENCES songs(id),
    position INTEGER NOT NULL,
    PRIMARY KEY (playlist_id, song_id)
);

-- Användningstatistik
CREATE TABLE usage_statistics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    song_id INTEGER REFERENCES songs(id),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_played INTEGER NOT NULL,
    device_type VARCHAR(50) NOT NULL
);

-- Betalningshistorik
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SEK',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subscription_period_start DATE NOT NULL,
    subscription_period_end DATE NOT NULL,
    payment_status VARCHAR(50) NOT NULL
);

-- Användarinställningar
CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    preferred_energy_level energy_level,
    shuffle_enabled BOOLEAN DEFAULT false,
    repeat_enabled BOOLEAN DEFAULT false,
    volume_settings JSON,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 