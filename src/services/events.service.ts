import { TIME_OF_DAY } from "../constants/events.constants";
import pool, { QueryBuilder } from "../database/postgres.database";

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
                events.schedule::text,
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
        const withParticipants = !!queryFilters.withParticipants;
        const filterOut = !!queryFilters.filterOut;
        const page = queryFilters.page ? parseInt(queryFilters.page.toString().trim()) : 0;
        const limit = queryFilters.limit ? parseInt(queryFilters.limit.toString().trim()) : 20;

        const queryBuilder = new QueryBuilder(`SELECT
            events.id AS event_id,
            events.description,
            events.schedule::text as schedule,
            events.location,
            events.expertise,
            events.sport_id,
            events.remaining - COUNT(participants.id) AS remaining,
            users.firstname AS owner_firstname,
            ${participantIdFilter ? "participants.status as participant_status," : ""}
            ${withParticipants ? `CASE
            WHEN COUNT(participants.id) > 0 THEN
                ARRAY_AGG(
                    JSON_BUILD_OBJECT(
                        'user_id', participants.user_id,
                        'status', participants.status,
                        'firstname', users.firstname,
                        'lastname', users.lastname,
                        'phone_number', users.phone_number,
                        'rating', rate.rating,
                        'count', rate.count
                    )
                )
                ELSE
                    ARRAY[]::JSON[]
            END AS participants,` : ""}
            rate.rating::float,
            rate.count::integer
            FROM
                events
            JOIN
                users ON events.owner_id = users.id
            LEFT JOIN
                participants ON events.id = participants.event_id
            LEFT JOIN (
                SELECT rated, avg(rating) as rating, count(rating) as count FROM ratings GROUP BY rated
            ) as rate ON events.owner_id = rate.rated OR participants.user_id = rate.rated            \n`);

        if (queryFilters !== undefined) {
            const sportId = queryFilters.sportId?.toString().trim();
            if (sportId !== undefined) queryBuilder.addFilter(`sport_id = ${sportId}`);

            const userId = queryFilters.userId?.toString().trim();
            if (userId !== undefined) queryBuilder.addFilter(`events.owner_id ${filterOut ? "!" : ""}= ${userId}`);
    
            const participantId = queryFilters.participantId?.toString().trim();
            if (participantIdFilter) queryBuilder.addFilter(`participants.user_id = ${participantId}`);

            const location = queryFilters.location?.toString().trim();
            if (location !== undefined) queryBuilder.addFilter(`events.location = '${location}'`);

            const expertise = queryFilters.expertise?.toString().trim();
            if (expertise !== undefined) queryBuilder.addFilter(`events.expertise = ${expertise}`);

            const date = queryFilters.date?.toString();
            if (date !== undefined) queryBuilder.addFilter(`TO_CHAR(schedule, 'YYYY-MM-DD') = '${date}'`);

            const schedule = queryFilters.schedule?.toString().trim();
            if (schedule !== undefined) queryBuilder.addFilter(this.getTimeEventFilter(schedule));

            queryBuilder.addFilter(`events.schedule >= CURRENT_TIMESTAMP`);
        }

        queryBuilder.addGroupBy(`events.id, users.firstname`);
        if (participantIdFilter) queryBuilder.addGroupBy(`participants.status`);
        queryBuilder.addGroupBy(`rate.rating, rate.count`);
        queryBuilder.addOrderBy(`events.schedule ASC `);
        queryBuilder.addPagination(page, limit);

        console.log(queryBuilder.build());

        const res = await pool.query(queryBuilder.build());
        return res.rows;
    }

    private getTimeEventFilter(schedule: string) {

        const times = `{${schedule.split(",")}}`

        return `
         ((EXTRACT(HOUR FROM events.schedule) >= 6 AND EXTRACT(HOUR FROM events.schedule) < 12 AND 0 = ANY('${times}')) OR
        (EXTRACT(HOUR FROM events.schedule) >= 12 AND EXTRACT(HOUR FROM events.schedule) < 18 AND 1 = ANY('${times}')) OR
        ((EXTRACT(HOUR FROM events.schedule) >= 18 OR EXTRACT(HOUR FROM events.schedule) < 6) AND 2 = ANY('${times}')))
        `;
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