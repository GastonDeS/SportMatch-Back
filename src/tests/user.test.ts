import UsersService from "../services/user.service";
// import { expect, jest} from "@jest/globals";
import pool from "../database/postgres.database";

jest.mock("../database/postgres.database");

const fakeUser = {
    user_id: 1,
    firstname: "Gaston",
    lastname: "De Schant",
    phone_number: "+5492235910125",
    email: "gdeschant@itba.edu.ar"
}

const fullUser = {
    user_id: fakeUser.user_id,
    firstname: fakeUser.firstname,
    lastname: fakeUser.lastname,
    phone_number: fakeUser.phone_number,
    email: fakeUser.email,
    sports: ["1","2"],
    locations: ["Toronto", "Belgrano"],
    rating: 5,
    count: 1
}

describe("User Service test", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
    });

    describe("get users", () => {
        it("should return a valid instance of userService", () => {
            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();
        });

        it("get user by email", async () => {
            pool.query.mockResolvedValueOnce({
                rows: [ fullUser ]
            });

            const userService = UsersService.getInstance();
            
            const user = await userService.getUserByEmail("gdeschant@itba.edu.ar");
            expect(user).toBeDefined();
            console.log(user);
            expect(user).toEqual(fullUser);
        });

        it("get users", async () => {
            pool.query.mockResolvedValue({
                rows: [ fakeUser ]
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            const users = await userService.getUsers();
            expect(users).toBeDefined();
            expect(users).toEqual([fakeUser]);
        });
    });

    describe("rateUser", () => {
        it("rate user", async () => {
            pool.query.mockResolvedValueOnce({
                rowCount: 1
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            await userService.rateUser("1", "2", 5, "3");
        })

        it("rate user with invalid event", async () => {
            pool.query.mockResolvedValueOnce({
                rowCount: 0
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            try {
                await userService.rateUser("1", "2", 5, "3");
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toBe("event doesn't exists, events is not rateable or the user wasn't a participant");
            }
        });

        it("already rated", async () => {
            pool.query.mockRejectedValueOnce({
                constraint: "unique_rating"
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            try {
                await userService.rateUser("1", "2", 5, "3");
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toBe("The user was already rated by the rater");
            }
        });

        it("db error", async () => {
            pool.query.mockRejectedValueOnce(new Error());

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            try {
                await userService.rateUser("1", "2", 5, "3");
            } catch (e) {
                expect(e).toBeDefined();
                expect(e.message).toBe("Internal server error");
            }
        });
    });

    describe("update user", () => {
        it("update all fields", async () => { // TODO: this should be tested more on the mocked db than the service
            pool.query.mockResolvedValue({
                rowCount: 1,
                rows: [
                    {
                        count: 1
                    }
                ]
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            await userService.updateUser("1", "gdeschant@itba.edu.ar", "+5492235910124", ["Toronto", "Belgrano"], ["1","2"]); 
            expect(pool.query).toBeCalledTimes(7);
        });

        it("update only phone number and remove locations and sports", async () => {
            pool.query.mockResolvedValue({
                rowCount: 1,
                rows: [
                    {
                        count: 1
                    }
                ]
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            await userService.updateUser("1", "gdeschant@itba.edu.ar", "+5492235910124", [], []);
            expect(pool.query).toBeCalledTimes(3);
        });

        it("remove locations", async () => {
            pool.query.mockResolvedValue({
                rowCount: 1,
                rows: [
                    {
                        count: 1
                    }
                ]
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            await userService.updateUser("1", "gdeschant@itba.edu.ar", "+5492235910124", [], ["1"]);
            expect(pool.query).toBeCalledTimes(5);
        });
    });

    describe("create user", () => {
        it("create user", async () => {
            pool.query.mockResolvedValue({
                rows: [ fakeUser ]
            });

            const userService = UsersService.getInstance();
            expect(userService).toBeDefined();

            const user = await userService.createUser(fakeUser.email, fakeUser.firstname, fakeUser.lastname, fakeUser.phone_number);
            expect(user).toBeDefined();
            expect(user).toEqual(fakeUser);
        }
        );
    });
});