import GenericException from "../exceptions/generic.exception";
import { IEvent, EventQuery } from "../interfaces/event.interface";
import { Page } from "../interfaces/api.interface";
import ParticipantPersistence from "../database/persistence/participant.persistence";
import UserPersistence from "../database/persistence/user.persistence";
import EventPersistence from "../database/persistence/event.persistence";
import Participant from "../database/models/Participant.model";
import Event, { IEventDetail } from "../database/models/Event.model";
import NotFoundException from "../exceptions/notFound.exception";
import { HTTP_STATUS } from "../constants/http.constants";

class EventsService {
    private static readonly instance: EventsService;

    private constructor() {
    }

    public static getInstance(): EventsService {
        if (!this.instance) return new EventsService();
        return this.instance;
    }

    public async addParticipant(eventId: string, participantId: string): Promise<Participant> {
        const event = await EventPersistence.getEventById(eventId);
        if (!event) throw new NotFoundException("Event");

        const participant = await ParticipantPersistence.createParticipant(eventId.toString(), participantId);
        return participant;
    }

    public async removeParticipant(eventId: string, participantId: string, ownerId?: string): Promise<void> {
        if (ownerId) {
            const event = await EventPersistence.getEventById(eventId);
            if (!event) throw new NotFoundException("Event");
            if (event.ownerId.toString() !== ownerId) throw new GenericException({ message: "User is not the owner of the event", status: HTTP_STATUS.BAD_REQUEST, internalStatus: "NOT_OWNER" });
        }
        const removed = await ParticipantPersistence.removeParticipant(eventId.toString(), participantId);
        if (!removed) throw new NotFoundException("Participant");
    }

    public async acceptParticipant(eventId: number, participantId: string, ownerId: string): Promise<void> {
        if (ownerId) {
            const event = await EventPersistence.getEventById(eventId.toString());
            if (!event) throw new NotFoundException("Event");
            if (event.ownerId.toString() !== ownerId) throw new GenericException({ message: "User is not the owner of the event", status: HTTP_STATUS.BAD_REQUEST, internalStatus: "NOT_OWNER" });
        }
        await ParticipantPersistence.updateStatus(eventId.toString(), participantId, true);
    }

    public async getParticipants(eventId: number, status?: boolean): Promise<any> {
        const participants = await ParticipantPersistence.getParticipantsDetailsByEventId(eventId.toString());

        if (status !== undefined) {
            return participants.filter((p: any) => p.participant_status === status);
        }

        return participants;
    }

    public async getEventById(eventId: string): Promise<IEventDetail> {
        const event = await EventPersistence.getEventDetailById(eventId.toString());
        if (!event) throw new NotFoundException("Event");

        return event;
    }

    public async getEvents(queryFilters: Record<string, string>, page = 0, limit = 20): Promise<Page<EventQuery>> {
        const events = await EventPersistence.getEvents(queryFilters, page, limit);

        return {
            page: page,
            pageSize: events.length,
            items: events
        };
    }

    public async createEvent(event: IEvent): Promise<Event> {
        return await EventPersistence.createEvent(event);
    }
}

export default EventsService;