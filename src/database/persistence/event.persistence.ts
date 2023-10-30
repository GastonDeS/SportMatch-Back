import QueryTypes from "sequelize/types/query-types";
import { IEvent } from "../../interfaces/event.interface";
import sequelize from "../connection";
import Event, { IEventDetail } from "../models/Event.model"
import Participant from "../models/Participant.model";
import User from "../models/User.model";
import { QueryBuilder } from "../utils/postgres.database";

class EventPersistence {
    static async createEvent(event: IEvent, ownerId: string): Promise<Event> {
        const newEvent = await Event.create({
            ownerId: ownerId,
            sportId: event.sportId,
            expertise: event.expertise,
            location: event.location,
            schedule: event.schedule,
            description: event.description,
            duration: event.duration,
            remaining: event.remaining
        });

        return newEvent;
    }

    // TODO: this is legacy too hard to improve
    static async getEvents(queryFilters: Record<string, string>, page: number, limit: number): Promise<any[]> {// return event detail
        const participantIdFilter = queryFilters.participantId?.toString().trim() !== undefined;
        const filterOut = !!queryFilters.filterOut;

        const queryBuilder = new QueryBuilder(`SELECT
        events.id AS event_id,
        events.description,
        events.schedule::text as schedule,
        events.location,
        events.expertise,
        events.sport_id,
        (events.remaining - COUNT(participants.id))::integer AS remaining,
        users.firstname AS owner_firstname,
        users.id AS owner_id,
        ${participantIdFilter ? "participants.status as participant_status," : ""}
        ${participantIdFilter ? "COALESCE(rated_aux.isRated, 0) as is_rated," : ""}
        COALESCE(rate.rating::float, 0) as rating,
        COALESCE(rate.count::integer, 0) as rate_count,
        CASE
            WHEN events.schedule > CURRENT_TIMESTAMP THEN 0
            WHEN events.schedule <= CURRENT_TIMESTAMP AND events.schedule + (events.duration * INTERVAL '1 minute') >= CURRENT_TIMESTAMP THEN 1
            ELSE 2
        END AS event_status
        FROM
            events
        JOIN
            users ON events.owner_id = users.id
        LEFT JOIN
            participants ON events.id = participants.event_id
        LEFT JOIN (
            SELECT rated, avg(rating) as rating, count(rating) as count FROM ratings GROUP BY rated
        ) as rate ON events.owner_id = rate.rated
        ${participantIdFilter ? `LEFT JOIN (
            SELECT max(1) as isRated, event_id from ratings where rater = ${queryFilters.participantId} group by event_id
        ) as rated_aux ON rated_aux.event_id = events.id` :
            ""}\n`);

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

        if (userId === undefined && participantId === undefined)
            queryBuilder.addFilter(`events.schedule >= CURRENT_TIMESTAMP`);
    }

    queryBuilder.addGroupBy(`events.id, users.firstname, users.id`);
    if (participantIdFilter) queryBuilder.addGroupBy(`participants.status`);
    queryBuilder.addGroupBy(`rate.rating, rate.count`);
    if (participantIdFilter)
        queryBuilder.addGroupBy(`rated_aux.isRated`);
    queryBuilder.addOrderBy(`events.schedule ASC `);
    queryBuilder.addPagination(page, limit);

        const events = await sequelize.query(queryBuilder.build());

        return events;
    }

    private static getTimeEventFilter(schedule: string): string {

        const times = `{${schedule.split(",")}}`

        return `
         ((EXTRACT(HOUR FROM events.schedule) >= 6 AND EXTRACT(HOUR FROM events.schedule) < 12 AND 0 = ANY('${times}')) OR
        (EXTRACT(HOUR FROM events.schedule) >= 12 AND EXTRACT(HOUR FROM events.schedule) < 18 AND 1 = ANY('${times}')) OR
        ((EXTRACT(HOUR FROM events.schedule) >= 18 OR EXTRACT(HOUR FROM events.schedule) < 6) AND 2 = ANY('${times}')))
        `;
    }

    static async getEventDetailById(eventId: string): Promise<IEventDetail | null > {
        const eventDetails = await Event.findOne({
            where: { id: eventId },
            attributes: [
              ['id', 'event_id'],
              'description',
              'schedule',
              'location',
              'expertise',
              'sportId',
              [
                sequelize.literal('remaining - COUNT(participants.id)'),
                'remaining'
              ],
            ],
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['firstname', 'id'],
              },
              {
                model: Participant,
                where: { status: true },
                required: false,
                attributes: [],
              },
            ],
            group: ['Event.id', 'owner.id', 'owner.firstname'],
        });

        return eventDetails?.toJSON() as IEventDetail;
    }

    static async getEventById(id: string): Promise<Event | null > {
        return await Event.findOne({ where: { id: id }});
    }

    static async getEventByIdWithParticipants(id: string): Promise<Event | null > {
        return await Event.findOne({ where: { id: id }, include: { model: Participant, attributes: ['user_id', 'status'] }});
    }
}

export default EventPersistence;