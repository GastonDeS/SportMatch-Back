import PG from "pg";


const pool = new PG.Pool({
  user: 'sportsmatch',
  host: 'localhost',
  database: 'sportsmatchdb',
  password: 'sportsmatch',
  port: 5433,
});

export default pool;