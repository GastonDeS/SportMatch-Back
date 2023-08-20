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
        console.log(users);
    }

    public async getUserByEmail(email: string): Promise<any> {
        const users = await pool.query(`SELECT * FROM users WHERE email = $1;`, [email]);
        return users.rows[0];
    }
}

export default UsersService;