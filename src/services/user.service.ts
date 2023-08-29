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
                    u.telephone,
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

    public async createUser(email: string, firstname: string, lastname: string, telephone: string): Promise<any> {
        const users = await pool.query(`INSERT INTO users(email, firstname, lastname, telephone) VALUES($1, $2, $3, $4) RETURNING *;`, [email, firstname, lastname, telephone]);
        return users.rows[0];
    }

    public async updateUser(userId: string, telephone?: string, locations?: string[], sports?: string[]): Promise<any> {
        if (telephone) await this.updatePhoneNumber(userId, telephone);
        if (locations) await this.updateLocations(userId, locations);
        if (sports) await this.updateSports(userId, sports);
    }

    private async updatePhoneNumber(userId: string, telephone: string): Promise<any> {
        await pool.query(`UPDATE users SET telephone = $1 WHERE id = $2;`, [telephone, userId]);
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