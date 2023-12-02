

export default interface IEventDetailDto {
    id: string;
    description: string;
    schedule: Date;
    location: string;
    expertise: number;
    sportId: number;
    remaining: string;
    owner: { 
        firstName: string,
        id: number 
    }
    status: number;
}