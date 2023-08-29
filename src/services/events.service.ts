import pool from "../database/postgres.database";

class EventsService {
    private static readonly instance: EventsService;

    private constructor() {
    }

    public static getInstance(): EventsService {
        if (!this.instance) return new EventsService();
        return this.instance;
    }

    public async addParticipant(eventId: number, userId: number): Promise<void> {
        const query = `INSERT INTO participants(event_id, user_id, status)
        VALUES(${eventId}, ${userId}, 'false')`;

        await pool.query(query);
    }

    public async acceptParticipant(eventId: number, userId: number): Promise<void> {
        const query = `UPDATE participants
        SET status = 'true'
        WHERE event_id = ${eventId} AND user_id = ${userId}`;

        await pool.query(query);
    }

    public async getParticipants(eventId: number): Promise<any> {
        const query = `SELECT * FROM participants WHERE event_id = ${eventId}`;
        const res = await pool.query(query);
        return res.rows;
    }

    public async getEventById(eventId: number): Promise<any> {
        const query = `SELECT
                events.id AS event_id,
                events.description,
                events.time,
                events.location,
                events.expertise,
                events.sport_id,
                events.remaining - COUNT(participants.id) AS remaining,
                users.firstname AS owner_firstname
            FROM
                events
            JOIN
                users ON events.owner_id = users.id
            LEFT JOIN
                participants ON events.id = participants.event_id AND participants.status = 'true'
            WHERE
                events.id = ${eventId}
            GROUP BY
                events.id, users.firstname`;
                
        const res = await pool.query(query);
        return res.rows;
    }

    public async getEvents(queryFilters: Record<string, string>): Promise<any> {
        const participantIdFilter = queryFilters.participantId?.toString().trim() !== undefined;

        let query = `SELECT
                events.id AS event_id,
                events.description,
                events.time,
                events.location,
                events.expertise,
                events.sport_id,
                events.remaining - COUNT(participants.id) AS remaining,
                users.firstname AS owner_firstname
                ${participantIdFilter ? ", participants.status as participant_status" : ""}
            FROM
                events
            JOIN
                users ON events.owner_id = users.id
            LEFT JOIN
                participants ON events.id = participants.event_id\n`;


        if (queryFilters != undefined) {
            const sportId = queryFilters.sportId?.toString().trim();
            if (sportId !== undefined) {
                query = query.concat(" WHERE sport_id = " + sportId);
            }
    
            const userId = queryFilters.userId?.toString().trim();
            if (userId !== undefined) {
                query = query.concat(query.includes("WHERE") ? " AND " : " WHERE ");
                query = query.concat("events.owner_id = " + userId);
            }
    
            const participantId = queryFilters.participantId?.toString().trim();
            if (participantIdFilter) {
                query = query.concat(query.includes("WHERE") ? " AND " : " WHERE ");
                query = query.concat("participants.user_id = " + participantId);
            }
        }

        query = query.concat(` GROUP BY
        events.id, users.firstname ${participantIdFilter ? ", participants.status" : ""};`);

        console.log(query);

        const res = await pool.query(query);
        return res.rows;
    }

    public async createEvent(
        owner_id: number,
        sport_id: number,
        expertise: number,
        location: string,
        time: string,
        description: string,
        remaining: number
    ) {
        const query = `INSERT INTO events(owner_id, sport_id, expertise, location, time, description, remaining)
        VALUES(${owner_id}, ${sport_id}, ${expertise}, ${location ? `'${location}'` : null }, TO_TIMESTAMP('${time}', 'YYYY-MM-DD HH24:MI:SS'), ${description ? `'${description}'` : null}, ${remaining}) RETURNING id;`;

        const res = await pool.query(query);
        return res.rows[0].id;
    }
}

export default EventsService;