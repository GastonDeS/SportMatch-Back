import pool from "../database/postgres.database";

// this is a helper for running on local
export const createDBTables = async (): Promise<void>  => {
    await pool.query(`DROP TABLE IF EXISTS participants;`);
    await pool.query(`DROP TABLE IF EXISTS events;`);
    await pool.query(`DROP TABLE IF EXISTS sports;`);
    await pool.query(`DROP TABLE IF EXISTS users;`);

    await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        firstname varchar(256),
        lastname varchar(256),
        telephone varchar(256) unique,
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
        time timestamp,
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
        status varchar(256),
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

    await pool.query(`INSERT INTO users (firstname, lastname, telephone, email) VALUES
        ('John', 'Doe', '2235910122', 'caberna@gmail.com'),
        ('Jane', 'Doe', '4234143122', 'janeDoe@gmail.com') ON CONFLICT (email) DO NOTHING;`);

    await pool.query(`INSERT INTO events (owner_id, description, sport_id, time, location, expertise, remaining) VALUES
        (1, 'Football match', 1, '2021-05-01 10:00:00', 'Calle de la piruleta 1', 1, 1),
        (2, 'Football match', 1, '2021-05-01 10:00:00', 'Calle de la piruleta 1', 1, 1),
        (2, 'Basket match', 2, '2021-05-01 10:00:00', 'Calle de la piruleta 1', 1, 1)`);

    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (2, 1, 'true')`);
    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (3, 1, 'false')`);
    await pool.query(`INSERT INTO participants (event_id, user_id, status) VALUES
        (1, 2, 'false')`);
}

