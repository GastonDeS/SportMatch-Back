import pool from "../database/postgres.database";


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
                    ARRAY_AGG(DISTINCT ul.location) AS locations
                FROM users u
                LEFT JOIN users_sports us ON u.id = us.user_id
                LEFT JOIN users_locations ul ON u.id = ul.user_id
                    WHERE u.email = $1
                    GROUP BY u.id;`, [email]);

        return user.rows[0];
    }

    public async rateUser(rated: string, rater: string, rating: number, eventId: string): Promise<any> {
        await pool.query(`INSERT INTO ratings(rated, rater, rating, event_id) 
        SELECT ${rated}, ${rater}, ${rating}, ${eventId}
        FROM events
        WHERE id = ${eventId} AND CURRENT_TIMESTAMP > schedule;`, [rated, rater, rating, eventId]);
    }

    public async createUser(email: string, firstname: string, lastname: string, phone_number: string): Promise<any> {
        const users = await pool.query(`INSERT INTO users(email, firstname, lastname, phone_number) VALUES($1, $2, $3, $4) RETURNING *;`, [email, firstname, lastname, phone_number]);
        return users.rows[0];
    }

    public async updateUser(userId: string, phone_number?: string, locations?: string[], sports?: string[]): Promise<any> {
        if (phone_number) await this.updatePhoneNumber(userId, phone_number);
        if (locations) await this.updateLocations(userId, locations);
        if (sports) await this.updateSports(userId, sports);
    }

    private async updatePhoneNumber(userId: string, phone_number: string): Promise<any> {
        await pool.query(`UPDATE users SET phone_number = $1 WHERE id = $2;`, [phone_number, userId]);
    }

    private async updateLocations(userId: string, locations: string[]): Promise<any> {
        const query = `INSERT INTO users_locations (user_id, location_id) VALUES ($1, $2) ON CONFLICT (user_id, location_id) DO NOTHING;`;
        const promises = locations.map(async (locationId: string) => await pool.query(query, [userId, locationId]));
        await Promise.all(promises);
    }

    private async updateSports(userId: string, sports: string[]): Promise<void> {
        const query = `INSERT INTO users_sports (user_id, sport_id) VALUES ($1, $2) ON CONFLICT (user_id, sport_id) DO NOTHING;`;
        const promises = sports.map(async (sportId: string) => await pool.query(query, [userId, sportId]));
        await Promise.all(promises);
    }
}

export default UsersService;