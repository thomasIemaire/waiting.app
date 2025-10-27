export interface StoredUser {
    id: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
}

export const users: StoredUser[] = [
    {
        id: '1',
        email: 'john.doe@example.com',
        password: 'Password123!',
        firstname: 'John',
        lastname: 'Doe'
    },
    {
        id: '2',
        email: 'jane.smith@example.com',
        password: 'Password123!',
        firstname: 'Jane',
        lastname: 'Smith'
    }
];
