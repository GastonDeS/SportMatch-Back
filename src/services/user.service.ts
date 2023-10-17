import pool from "../database/postgres.database";
import GenericException from "../exceptions/generic.exception";


class UsersService {
    private static instance: UsersService;

    static getInstance() {
        if (!UsersService.instance) UsersService.instance = new UsersService();
        return UsersService.instance;
    }

    private constructor() {

    }

    public async getUsers(): Promise<any> {
        const users = await pool.query(`SELECT * FROM users;`);
        return users.rows;
    }

    public async getUserByEmail(email: string): Promise<any> {
        const user = await pool.query(`
        SELECT
        u.id AS user_id,
        u.firstname,
        u.lastname,
        u.phone_number,
        u.email,
        ARRAY_AGG(DISTINCT (us.sport_id)) AS sports,
        ARRAY_AGG(DISTINCT ul.location) AS locations,
        COALESCE(avg(r.rating)::float, 0) as rating,
        COALESCE(r.count_ratings, 0)::integer as count
    FROM users u
    LEFT JOIN users_sports us ON u.id = us.user_id
    LEFT JOIN users_locations ul ON u.id = ul.user_id
    LEFT JOIN (
        SELECT rated, AVG(rating) AS rating, COUNT(*) AS count_ratings
        FROM ratings
        GROUP BY rated
    ) r ON u.id = r.rated
    WHERE u.email = $1
    GROUP BY u.id, r.count_ratings;`, [email]);

        return user.rows[0];
    }

    public async rateUser(rated: string, rater: string, rating: number, eventId: string): Promise<any> {
        const query = `
          WITH selected_event AS (
            SELECT id
            FROM events
            WHERE id = $1 AND events.schedule + (events.duration * INTERVAL '1 minute') < CURRENT_TIMESTAMP
          )
          INSERT INTO ratings(rated, rater, rating, event_id)
          SELECT $2, (SELECT id from users where email = $3), $4, se.id
          FROM selected_event se returning id;
        `;
      
        const values = [eventId, rated, rater, rating];
      
        try {
            const res = await pool.query(query, values);
            if (res.rowCount === 0) throw new GenericException(
                { 
                    message: "event doesn't exists, events is not rateable or the user wasn't a participant", 
                    status: 404, 
                    internalStatus: "NOT_FOUND"
                })
        } catch (err) {
            if (err.constraint === "unique_rating")
                throw new GenericException({ message: "The user was already rated by the rater", status: 409, internalStatus: "CONFLICT"});
            if (err instanceof GenericException) throw err;
            throw new GenericException({ message: "Internal server error", status: 500, internalStatus: "INTERNAL_SERVER_ERROR"});
        }
      }
      

    public async createUser(email: string, firstname: string, lastname: string, phone_number: string): Promise<any> {
        const users = await pool.query(`INSERT INTO users(email, firstname, lastname, phone_number) VALUES($1, $2, $3, $4) RETURNING *;`, [email, firstname, lastname, phone_number]);
        return users.rows[0];
    }

    public async updateUser(userId: string, email: string, phone_number?: string, locations?: string[], sports?: string[]): Promise<any> {
        if (phone_number) await this.updatePhoneNumber(userId, email, phone_number);
        if (locations) await this.updateLocations(userId, email, locations);
        if (sports) await this.updateSports(userId, email, sports);
    }

    private async updatePhoneNumber(userId: string, email: string, phone_number: string): Promise<any> {
        const res = await pool.query(`UPDATE users SET phone_number = $1 WHERE id = $2 AND email = $3 returning id;`, [phone_number, userId, email]);
        if (res.rowCount === 0) throw new GenericException({ message: "User not found", status: 404, internalStatus: "NOT_FOUND"});
    }

    private async updateLocations(userId: string, email: string, locations: string[]): Promise<any> {
        if (locations.length > 0) {
            const res = await pool.query(`SELECT count(*) FROM users WHERE id = $1 AND email = $2;`, [userId, email]);
            if (res.rows[0].count === 0) throw new GenericException({ message: "User not found", status: 404, internalStatus: "NOT_FOUND"});
            await pool.query(`DELETE FROM users_locations WHERE user_id = $1;`, [userId]);

            const query = this.createLocationQuery(locations);
            await pool.query(query, [userId]);
        } else {
            await pool.query(`
                DELETE FROM users_locations WHERE user_id = (SELECT id from users where email = $2 AND id = $1);`, [userId, email]);
        }
    }

    private createLocationQuery(locations: string[]): string {
        let query = `
        INSERT INTO users_locations (user_id, location) values 
        `
        locations.forEach((location: string, index) => {
            query = query.concat(`($1, '${location}') `);
            if (locations.length > 1 && index < locations.length - 1) query = query.concat(", ");
        }
        );
        return query.concat("ON CONFLICT (user_id, location) DO NOTHING;");
    }

    private async updateSports(userId: string, email: string, sports: string[]): Promise<void> {
        if (sports.length > 0 ) {
            const res = await pool.query(`SELECT count(*) FROM users WHERE id = $1 AND email = $2;`, [userId, email]);
            if (res.rows[0].count === 0) throw new GenericException({ message: "User not found", status: 404, internalStatus: "NOT_FOUND"});
            await pool.query(`
                DELETE FROM users_sports WHERE user_id = (SELECT id from users where email = $2 AND id = $1);`, [userId, email]);
            const query = this.createSportsQuery(sports);
            await pool.query(query, [userId]);
        } else {
            await pool.query(`
                DELETE FROM users_sports WHERE user_id = (SELECT id from users where email = $2 AND id = $1);`, [userId, email]);
        }
    }

    private createSportsQuery(sports: string[]): string {
        let query = `
        INSERT INTO users_sports (user_id, sport_id) values 
        `
        sports.forEach((sportId: string, index) => {
            query = query.concat(`($1, ${sportId}) `);
            if (sports.length > 1 && index < sports.length - 1) query = query.concat(", ");
        }
        );
        return query.concat("ON CONFLICT (user_id, sport_id) DO NOTHING;");
    }
}

export default UsersService;