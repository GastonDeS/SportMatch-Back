import GenericException from "../exceptions/generic.exception";
import UserPersistence from "../database/persistence/user.persistence";
import User, { IUserDetail } from "../database/models/User.model";
import UserLocationPersistence from "../database/persistence/userLocation.persistence";
import UserSportPersistence from "../database/persistence/userSport.persistense";
import RatingPersistence from "../database/persistence/rating.persistence";
import EventPersistence from "../database/persistence/event.persistence";
import NotFoundException from "../exceptions/notFound.exception";
import { Transaction } from "sequelize";


class UsersService {
    private static instance: UsersService;

    static getInstance() {
        if (!UsersService.instance) UsersService.instance = new UsersService();
        return UsersService.instance;
    }

    private constructor() {
    }

    public async getUsers(): Promise<any> {
        return await UserPersistence.getAllUsers();
    }

    public async getUserDetailById(id: string): Promise<IUserDetail> {
        const user = await UserPersistence.getUserDetailById(id);
        if (!user) throw new NotFoundException("User");

        return user;
    }

    public async rateUser(rated: string, rater: string, rating: number, eventId: string): Promise<void> {
        try {
            if (rated === rater) throw new GenericException({ message: "User can't rate himself", status: 400, internalStatus: "BAD_REQUEST"});

            const event = await EventPersistence.getEventByIdWithParticipants(eventId);
            if (!event) throw new NotFoundException("Event");
            if (event.schedule.getTime() + event.duration * 60000 > Date.now()) throw new GenericException({ message: "Event is not rateable", status: 400, internalStatus: "BAD_REQUEST"});

            // check that user can rate
            if ((event.participants.filter((participant) => participant.userId === +rated ||
              participant.userId === +rater).length + ((event.ownerId === +rated || event.ownerId === +rater) ? 1 : 0)) !== 2)
                throw new GenericException({ message: "User can't rate this event", status: 400, internalStatus: "BAD_REQUEST"});

            await RatingPersistence.rate(rated, rater, rating, eventId);
        } catch (err) {
            if (err instanceof GenericException) throw err;
            console.log(err);
            throw new GenericException({ message: "Internal server error", status: 500, internalStatus: "INTERNAL_SERVER_ERROR"});
        }
      }
      

    public async createUser(email: string, firstname: string, lastname: string, phone_number: string, birthdate: string, transaction: Transaction): Promise<User> {
        return await UserPersistence.createUser({ email, firstname, lastname, phone_number, birthdate}, transaction);
    }

    public async updateUser(userId: string, phone_number?: string, locations?: string[], sports?: string[]): Promise<void> {
        if (phone_number) await this.updatePhoneNumber(userId, phone_number);
        if (locations) await this.updateLocations(userId, locations);
        if (sports) await this.updateSports(userId, sports);
    }

    private async updatePhoneNumber(userId: string, phone_number: string): Promise<User> {
        const updatedUser = await UserPersistence.updatePhoneNumber(+userId, phone_number);        

        return updatedUser;
    }

    private async updateLocations(userId: string, locations: string[]): Promise<void> {
        const newLocations = UserLocationPersistence.updateUserLocations(userId, locations); // TODO: send email? or update token to have email
    }

    private async updateSports(userId: string, sports: string[]): Promise<void> {
        const newSports = await UserSportPersistence.updateUserSports(userId, sports);
    }
}

export default UsersService;