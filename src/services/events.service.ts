import { TIME_OF_DAY } from "../constants/events.constants";
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
        VALUES(${eventId}, ${userId}, false)`;

        await pool.query(query);
    }

    public async removeParticipant(eventId: number, userId: number): Promise<void> {
        const query = `DELETE FROM participants
        WHERE event_id = ${eventId} AND user_id = ${userId}`;

        await pool.query(query);
    }

    public async acceptParticipant(eventId: number, userId: number): Promise<void> {
        const query = `UPDATE participants
        SET status = true
        WHERE event_id = ${eventId} AND user_id = ${userId}`;

        await pool.query(query);
    }

    public async getParticipants(eventId: number): Promise<any> {
        const query =   `SELECT 
                            participants.user_id,
                            users.firstname as firstname,
                            users.lastname as lastname,
                            participants.status as participant_status,
                            users.phone_number as phone_number
                        FROM participants 
                            left outer join users on participants.user_id = users.id
                        WHERE event_id = ${eventId}`;
        const res = await pool.query(query);
        return res.rows;
    }

    public async getEventById(eventId: number): Promise<any> {
        const query = `SELECT
                events.id AS event_id,
                events.description,
                events.schedule,
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
        const filterOut = !!queryFilters.filterOut;
        const page = queryFilters.page ? parseInt(queryFilters.page.toString().trim()) : 0;
        const limit = queryFilters.limit ? parseInt(queryFilters.limit.toString().trim()) : 20;

        let query = `SELECT
                events.id AS event_id,
                events.description,
                events.schedule,
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


        let filtersActive = false;
        if (queryFilters != undefined) {
            const sportId = queryFilters.sportId?.toString().trim();
            if (sportId !== undefined) {
                query = query.concat(` WHERE sport_id = ${sportId}`);
                filtersActive = true;
            }
    
            const userId = queryFilters.userId?.toString().trim();
            if (userId !== undefined) {
                query = query.concat(filtersActive ? " AND " : " WHERE ");
                query = query.concat(`events.owner_id ${filterOut ? "!" : ""}= ${userId}`);
                filtersActive = true;
            }
    
            const participantId = queryFilters.participantId?.toString().trim();
            if (participantIdFilter) {
                query = query.concat(filtersActive ? " AND " : " WHERE ");
                query = query.concat(`participants.user_id = ${participantId}`);
                filtersActive = true;
            }

            const location = queryFilters.location?.toString().trim();
            if (location !== undefined) {
                query = query.concat(filtersActive ? " AND " : " WHERE ");
                query = query.concat(`events.location = '${location}'`);
                filtersActive = true;
            }

            const expertise = queryFilters.expertise?.toString().trim();
            if (expertise !== undefined) {
                query = query.concat(filtersActive ? " AND " : " WHERE ");
                query = query.concat(`events.expertise = ${expertise}`);
                filtersActive = true;
            }

            const schedule = queryFilters.schedule?.toString().trim();
            if (schedule !== undefined) {
                query = query.concat(filtersActive ? " AND " : " WHERE ");
                query = query.concat(this.getTimeEventFilter(schedule));
                filtersActive = true;
            }

            query = query.concat(filtersActive ? " AND " : " WHERE ");
            query = query.concat(`events.schedule >= CURRENT_TIMESTAMP`);
        }

        query = query.concat(` GROUP BY
        events.id, users.firstname ${participantIdFilter ? ", participants.status" : ""} 
            ORDER BY events.schedule ASC 
            LIMIT ${limit} OFFSET ${ page * limit}`);

        const res = await pool.query(query);
        return res.rows;
    }

    private getTimeEventFilter(schedule: string) {

        const times = `{${schedule.split(",")}}`

        return `
         ((EXTRACT(HOUR FROM events.schedule) >= 6 AND EXTRACT(HOUR FROM events.schedule) < 12 AND 0 = ANY('${times}')) OR
        (EXTRACT(HOUR FROM events.schedule) >= 12 AND EXTRACT(HOUR FROM events.schedule) < 18 AND 1 = ANY('${times}')) OR
        ((EXTRACT(HOUR FROM events.schedule) >= 18 OR EXTRACT(HOUR FROM events.schedule) < 6) AND 2 = ANY('${times}')))
        `
    }

    public async createEvent(
        owner_id: number,
        sport_id: number,
        expertise: number,
        location: string,
        schedule: string,
        description: string,
        remaining: number
    ) {
        const query = `INSERT INTO events(owner_id, sport_id, expertise, location, schedule, description, remaining)
        VALUES(${owner_id}, ${sport_id}, ${expertise}, ${location ? `'${location}'` : null }, TO_TIMESTAMP('${schedule}', 'YYYY-MM-DD HH24:MI:SS'), ${description ? `'${description}'` : null}, ${remaining}) RETURNING id;`;

        const res = await pool.query(query);
        return res.rows[0].id;
    }
}

export default EventsService;