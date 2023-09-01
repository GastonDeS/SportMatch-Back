import pool from "../database/postgres.database";

// this is a helper for running on local
export const createDBTables = async (): Promise<void>  => {
    await pool.query(`DROP TABLE IF EXISTS participants;`);
    await pool.query(`DROP TABLE IF EXISTS ratings;`);
    await pool.query(`DROP TABLE IF EXISTS users_sports;`);
    await pool.query(`DROP TABLE IF EXISTS users_locations;`);
    await pool.query(`DROP TABLE IF EXISTS events;`);
    await pool.query(`DROP TABLE IF EXISTS sports;`);
    await pool.query(`DROP TABLE IF EXISTS users;`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        firstname varchar(256),
        lastname varchar(256),
        phone_number varchar(256) unique,
        email varchar(256) unique
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS sports (
        id serial PRIMARY KEY,
        name varchar(256) unique
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS events (
        id serial PRIMARY KEY,
        owner_id integer REFERENCES users (id),
        description varchar(1024),
        sport_id integer REFERENCES sports (id),
        schedule timestamp,
        location varchar(256),
        expertise integer,
        remaining integer,
        CONSTRAINT fk_owner
            FOREIGN KEY(owner_id)
                REFERENCES users(id)
                ON DELETE CASCADE,
        CONSTRAINT fk_sport
            FOREIGN KEY(sport_id)
                REFERENCES sports(id)
                ON DELETE CASCADE
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS participants (
        id serial PRIMARY KEY,
        event_id integer REFERENCES events (id),
        user_id integer REFERENCES users (id),
        status boolean,
        CONSTRAINT fk_event
            FOREIGN KEY(event_id)
                REFERENCES events(id)
                ON DELETE CASCADE
    );`);

    await pool.query(`INSERT INTO sports (name) VALUES
        ('football'),
        ('basket'),
        ('tennis'),
        ('paddle') ON CONFLICT (name) DO NOTHING;`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users_sports (
        id serial PRIMARY KEY,
        user_id integer,
        sport_id integer,
        CONSTRAINT fk_user
            FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,
        CONSTRAINT fk_sport
            FOREIGN KEY(sport_id)
                REFERENCES sports(id)
                ON DELETE CASCADE,
        CONSTRAINT unique_sports_user UNIQUE(user_id, sport_id)
    );
    `);

    await pool.query(`CREATE TABLE IF NOT EXISTS users_locations (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users (id),
        location varchar(256),
        CONSTRAINT fk_user
            FOREIGN KEY(user_id)
                REFERENCES users(id)
                ON DELETE CASCADE,
        CONSTRAINT unique_location_user UNIQUE(user_id, location)
    );
    `);

    await pool.query(`CREATE TABLE IF NOT EXISTS ratings (
        id serial PRIMARY KEY,
        rated integer REFERENCES users (id),
        rater integer REFERENCES users (id),
        rating integer,
        eventId integer REFERENCES events (id),
        CONSTRAINT fk_rated
            FOREIGN KEY(rated)
                REFERENCES users(id),
        CONSTRAINT fk_rater
            FOREIGN KEY(rater)
                REFERENCES users(id),
        CONSTRAINT fk_event
            FOREIGN KEY(eventId)
                REFERENCES events(id),
        CONSTRAINT unique_rating UNIQUE(rated, rater, eventId),
        CONSTRAINT check_rating CHECK(rating >= 1 AND rating <= 5) );`
    );

    await pool.query(`INSERT INTO users (firstname, lastname, phone_number, email) VALUES
        ('John', 'Doe', '2235910122', 'caberna@gmail.com'),
        ('Jane', 'Doe', '2235910125', 'janeDoe@gmail.com'),
	('Marcos', 'Doe','1121576282', 'marcos@gmail.com') ON CONFLICT (email) DO NOTHING;`);

    await pool.query(`INSERT INTO users_sports (user_id, sport_id) VALUES
        (1, 1),
        (1, 2),
	(1, 3);`);

    await pool.query(`INSERT INTO users_locations (user_id, location) VALUES
        (1, 'Agronomía'),
        (1, 'Almagro'),
	(1, 'Belgrano');`);

    await pool.query(`INSERT INTO events (owner_id, description, sport_id, schedule, location, expertise, remaining) VALUES
        (1, 'Football match', 1, '2023-09-01 20:00:00', 'Almagro', 1, 1),
        (2, 'Football match', 1, '2023-09-01 10:00:00', 'Caballito', 1, 1),
        (2, 'Basket match', 2, '2023-09-02 9:00:00', 'Chacarita', 1, 1),
	    (3, 'Nuevo partido', 3, '2022-09-04 11:00:00', 'Agronomía', 2, 3);`);

    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (2, 1, true);`);
    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (3, 1, false);`);
    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (1, 2, false);`);
    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (1, 3, false);`);

    await pool.query(`INSERT INTO ratings (rated, rater, rating, eventId) VALUES
        (2, 1, 5, 1);`);
}

