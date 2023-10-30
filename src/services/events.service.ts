import GenericException from "../exceptions/generic.exception";
import { IEvent, EventQuery } from "../interfaces/event.interface";
import { Page } from "../interfaces/api.interface";
import ParticipantPersistence from "../database/persistence/participant.persistence";
import UserPersistence from "../database/persistence/user.persistence";
import EventPersistence from "../database/persistence/event.persistence";
import Participant from "../database/models/Participant.model";
import Event, { IEventDetail } from "../database/models/Event.model";
import NotFoundException from "../exceptions/notFound.exception";

class EventsService {
    private static readonly instance: EventsService;

    private constructor() {
    }

    public static getInstance(): EventsService {
        if (!this.instance) return new EventsService();
        return this.instance;
    }

    public async addParticipant(eventId: string, email: string): Promise<Participant> {
        const event = await EventPersistence.getEventById(eventId);
        if (!event) throw new NotFoundException("Event");
        const user = await UserPersistence.getUserByEmail(email);
        if (!user) throw new NotFoundException("User");

        const participant = await ParticipantPersistence.createParticipant(eventId.toString(), user.id.toString());
        return participant;
    }

    public async removeParticipant(eventId: string, email: string, ownerEmail?: string): Promise<void> {
        const user = await UserPersistence.getUserByEmail(email);
        if (!user) throw new NotFoundException("User");
        if (ownerEmail) {
            const owner = await UserPersistence.getUserByEmail(ownerEmail);
            if (!owner) throw new NotFoundException("Owner")
            const event = await EventPersistence.getEventById(eventId);
            if (!event) throw new NotFoundException("Event");
            if (event.ownerId !== owner.id) throw new GenericException({ message: "User is not the owner of the event", status: 400, internalStatus: "NOT_OWNER" });
        }
        const removed = await ParticipantPersistence.removeParticipant(eventId.toString(), user.id.toString());
        if (!removed) throw new NotFoundException("Participant");
    }

    public async acceptParticipant(eventId: number, email: string, ownerEmail: string): Promise<void> {
        const user = await UserPersistence.getUserByEmail(email);
        if (!user) throw new NotFoundException("User");
        if (ownerEmail) {
            const owner = await UserPersistence.getUserByEmail(ownerEmail);
            if (!owner) throw new NotFoundException("Owner")
            const event = await EventPersistence.getEventById(eventId.toString());
            if (!event) throw new NotFoundException("Event");
            if (event.ownerId !== owner.id) throw new GenericException({ message: "User is not the owner of the event", status: 400, internalStatus: "NOT_OWNER" });
        }
        await ParticipantPersistence.updateStatus(eventId.toString(), user.id.toString(), true);
    }

    public async getParticipants(eventId: number): Promise<any> {
        return await ParticipantPersistence.getParticipantsDetailsByEventId(eventId.toString());
    }

    public async getEventById(eventId: string): Promise<IEventDetail> {
        const event = await EventPersistence.getEventDetailById(eventId.toString());
        if (!event) throw new NotFoundException("Event");

        return event;
    }

    public async getEvents(queryFilters: Record<string, string>): Promise<Page<EventQuery>> {
        const page = queryFilters.page ? parseInt(queryFilters.page.toString().trim()) : 0;
        const limit = queryFilters.limit ? parseInt(queryFilters.limit.toString().trim()) : 20;        

        const events = await EventPersistence.getEvents(queryFilters, page, limit);

        return {
            page: page,
            pageSize: events.length,
            items: events
        };
    }

    public async createEvent(event: IEvent): Promise<Event> {
        const owner = await UserPersistence.getUserByEmail(event.ownerEmail);
        if (!owner) throw new NotFoundException("Owner" );

        return await EventPersistence.createEvent(event, owner.id.toString());
    }
}

export default EventsService;